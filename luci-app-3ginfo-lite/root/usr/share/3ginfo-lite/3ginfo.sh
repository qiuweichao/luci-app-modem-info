#!/bin/sh

#
# (c) 2010-2022 Cezary Jackiewicz <cezary@eko.one.pl>
#
# (c) 2021-2022 modified by Rafał Wabik - IceG - From eko.one.pl forum
#

band() {
	case "$1" in
		1) echo "${2}B1 (2100 MHz)";;
		3) echo "${2}B3 (1800 MHz)";;
		7) echo "${2}B7 (2600 MHz)";;
		8) echo "${2}B8 (900 MHz)";;
		20) echo "${2}B20 (800 MHz)";;
		41) echo "${2}B41 (20 MHz)";;
		*) echo "$1";;
	esac
}

RES="/usr/share/3ginfo-lite"

DEVICE=$(uci -q get 3ginfo.@3ginfo[0].device)
if [ "x$DEVICE" = "x" ]; then
	touch /tmp/modem
	DEVICE=$(cat /tmp/modem)
else
	echo "$DEVICE" > /tmp/modem
fi

if [ "x$DEVICE" = "x" ]; then
	devices=$(ls /dev/ttyUSB* /dev/cdc-wdm* /dev/ttyACM* /dev/ttyHS* 2>/dev/null | sort -r)
	for d in $devices; do
		DEVICE=$d gcom -s $RES/probeport.gcom > /dev/null 2>&1
		if [ $? = 0 ]; then
			echo "$d" > /tmp/modem
			break
		fi
	done
	DEVICE=$(cat /tmp/modem)
	uci set 3ginfo.@3ginfo[0].device=$DEVICE
	uci commit 3ginfo
fi

if [ "x$DEVICE" = "x" ]; then
	echo '{"error":"Device not found"}'
	exit 0
fi

	SEC=$(uci -q get 3ginfo.@3ginfo[0].network)
	if [ -z "$SEC" ]; then
		getpath $DEVICE
		PORIG=$P
		for DEV in /sys/class/tty/* /sys/class/usbmisc/*; do
			getpath "/dev/"${DEV##/*/}
			if [ "x$PORIG" = "x$P" ]; then
				SEC=$(uci show network | grep "/dev/"${DEV##/*/} | cut -f2 -d.)
				[ -n "$SEC" ] && break
			fi
		done
	fi


CONN_TIME="-"
RX="-"
TX="-"

NETUP=$(ifstatus $SEC | grep "\"up\": true")
if [ -n "$NETUP" ]; then

		CT=$(uci -q -P /var/state/ get network.$SEC.connect_time)
		if [ -z $CT ]; then
			CT=$(ifstatus $SEC | awk -F[:,] '/uptime/ {print $2}' | xargs)
		else
			UPTIME=$(cut -d. -f1 /proc/uptime)
			CT=$((UPTIME-CT))
		fi
		if [ ! -z $CT ]; then
			D=$(expr $CT / 60 / 60 / 24)
			H=$(expr $CT / 60 / 60 % 24)
			M=$(expr $CT / 60 % 60)
			S=$(expr $CT % 60)
			CONN_TIME=$(printf "%dd, %02d:%02d:%02d" $D $H $M $S)
		fi
		IFACE=$(ifstatus $SEC | awk -F\" '/l3_device/ {print $4}')
		if [ -n "$IFACE" ]; then
			RX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$2}')
			TX=$(ifconfig $IFACE | awk -F[\(\)] '/bytes/ {printf "%s",$4}')
		fi

fi

O=$(sms_tool -D -d $DEVICE at "AT+CSQ;+CPIN?;+COPS=3,0;+COPS?;+COPS=3,2;+COPS?;+CREG=2;+CREG?")

# CSQ
CSQ=$(echo "$O" | awk -F[,\ ] '/^\+CSQ/ {print $2}')

[ "x$CSQ" = "x" ] && CSQ=-1
if [ $CSQ -ge 0 -a $CSQ -le 31 ]; then
	CSQ_PER=$(($CSQ * 100/31))
else
	CSQ="-"
	CSQ_PER=0
fi

# COPS numeric
COPS_NUM=$(echo "$O" | awk -F[\"] '/^\+COPS: .,2/ {print $2}')
if [ "x$COPS_NUM" = "x" ]; then
	COPS_NUM="-"
	COPS_MCC="-"
	COPS_MNC="-"
else
	COPS_MCC=${COPS_NUM:0:3}
	COPS_MNC=${COPS_NUM:3:3}
	COPS=$(awk -F[\;] '/'$COPS_NUM'/ {print $2}' $RES/mccmnc.dat)
fi
[ "x$COPS" = "x" ] && COPS=$COPS_NUM

if [ -z "$FORCE_PLMN" ]; then
	# COPS alphanumeric
	T=$(echo "$O" | awk -F[\"] '/^\+COPS: .,0/ {print $2}')
	[ "x$T" != "x" ] && COPS="$T"
fi

COPZ=$(echo $COPS | sed ':s;s/\(\<\S*\>\)\(.*\)\<\1\>/\1\2/g;ts')
COPS=$(echo $COPZ | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) substr($i,2) }}1')

T=$(echo "$O" | awk -F[,\ ] '/^\+CPIN:/ {print $0;exit}' | xargs)
if [ -n "$T" ]; then
	[ "$T" = "+CPIN: READY" ] || REG=$(echo "$T" | cut -f2 -d: | xargs)
fi

T=$(echo "$O" | awk -F[,\ ] '/^\+CME ERROR:/ {print $0;exit}')
if [ -n "$T" ]; then
	case "$T" in
	"+CME ERROR: 10"*) REG="SIM not inserted";;
	"+CME ERROR: 11"*) REG="SIM PIN required";;
	"+CME ERROR: 12"*) REG="SIM PUK required";;
	"+CME ERROR: 13"*) REG="SIM failure";;
	"+CME ERROR: 14"*) REG="SIM busy";;
	"+CME ERROR: 15"*) REG="SIM wrong";;
	"+CME ERROR: 17"*) REG="SIM PIN2 required";;
	"+CME ERROR: 18"*) REG="SIM PUK2 required";;
	*) REG=$(echo "$T" | cut -f2 -d: | xargs);;
	esac
fi

# CREG
eval $(echo "$O" | awk -F[,] '/^\+CREG/ {gsub(/[[:space:]"]+/,"");printf "T=\"%d\";LAC_HEX=\"%X\";CID_HEX=\"%X\";LAC_DEC=\"%d\";CID_DEC=\"%d\";MODE_NUM=\"%d\"", $2, "0x"$3, "0x"$4, "0x"$3, "0x"$4, $5}')
case "$T" in
	0*)
		REG="0"
		CSQ="-"
		CSQ_PER=0
		;;
	1*)
		REG="1"
		;;
	2*)
		REG="2"
		CSQ="-"
		CSQ_PER=0
		;;
	3*)
		REG="3"
		CSQ="-"
		CSQ_PER=0
		;;
	5*)
		REG="5"
		;;
	*)
		REG="-"
		CSQ="-"
		CSQ_PER=0
		;;
esac

# MODE
if [ -z "$MODE_NUM" ] || [ "x$MODE_NUM" = "x0" ]; then
	MODE_NUM=$(echo "$O" | awk -F[,] '/^\+COPS/ {print $4;exit}')
fi
case "$MODE_NUM" in
	2*) MODE="UMTS";;
	3*) MODE="EDGE";;
	4*) MODE="HSDPA";;
	5*) MODE="HSUPA";;
	6*) MODE="HSPA";;
	7*) MODE="LTE";;
	 *) MODE="-";;
esac

# TAC
OTX=$(sms_tool -d $DEVICE at "at+cereg")
TAC=$(echo "$OTX" | awk -F[,] '/^\+CEREG/ {printf "%s", toupper($3)}' | sed 's/[^A-F0-9]//g')
if [ "x$TAC" != "x" ]; then
	TAC_HEX=$(printf %d 0x$TAC)
else
	TAC="-"
	TAC_HEX="-"
fi

DEVICE=$(uci -q get 3ginfo.@3ginfo[0].device)
if echo "x$DEVICE" | grep -q "192.168."; then
	if grep -q "Vendor=1bbb" /sys/kernel/debug/usb/devices; then
		. $RES/3ginfo-hilink/alcatel_hilink.sh $DEVICE
	fi
	if grep -q "Vendor=12d1" /sys/kernel/debug/usb/devices; then
		. $RES/3ginfo-hilink/huawei_hilink.sh $DEVICE
	fi
	if grep -q "Vendor=19d2" /sys/kernel/debug/usb/devices; then
		. $RES/3ginfo-hilink/zte.sh $DEVICE
	fi
	SEC=$(uci -q get 3ginfo.@3ginfo[0].network)
	SEC=${SEC:-wan}
else

_DEVS=$(awk '/Vendor=/{gsub(/.*Vendor=| ProdID=| Rev.*/,"");print}' /sys/kernel/debug/usb/devices | sort -u)
for _DEV in $_DEVS; do
	if [ -e "$RES/3ginfo-addon/$_DEV" ]; then
		. "$RES/3ginfo-addon/$_DEV"
		break
	fi
done

fi


cat <<EOF
{
"connt":"$CONN_TIME",
"conntx":"$TX",
"connrx":"$RX",
"modem":"$MODEL",
"mtemp":"$TEMP",
"firmware":"$FW",
"cport":"$DEVICE",
"protocol":"$PROTO",
"csq":"$CSQ",
"signal":"$CSQ_PER",
"operator_name":"$COPS",
"operator_mcc":"$COPS_MCC",
"operator_mnc":"$COPS_MNC",
"mode":"$MODE",
"registration":"$REG",
"lac_dec":"$LAC_DEC",
"imsi":"$IMSI",
"iccid":"$ICCID",
"imei":"$IMEI",
"satellite":"$STLS",
"latitude":"$LATDE",
"longitude":"$LOTDE",
"wsg_lo":"$WSG_LO",
"wsg_la":"$WSG_LA",
"gstate":"$GSTATE",
"lac_hex":"$LAC_HEX",
"tac_dec":"$TAC_DEC",
"tac_hex":"$TAC_HEX",
"cid_dec":"$CID_DEC",
"cid_hex":"$CID_HEX",
"pci":"$PCI",
"earfcn":"$EARFCN",
"pband":"$PBAND",
"sband":"$SBAND",
"spci":"$SPCI",
"searfcn":"$SEARFCN",
"rsrp":"$RSRP",
"rsrq":"$RSRQ",
"rssi":"$RSSI",
"sinr":"$SINR",
"addon":[$ADDON]
}
EOF
exit 0
