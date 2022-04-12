# Luci-app-modem-info

Luci-app-modem-info is fork from https://github.com/4IceG/luci-app-3ginfo-lite.git

Luci-app-modem-info是3ginfo项目的简化版本，适用于mPCI-E/M.2和USB 3G/LTE无线模块，在openwrt的web界面中可显示无线模块的相关信息。


``` bash
支持的模块 (已测试过):
 - Quectel EM12/EM160R-GL
 - Quectel EP06-E
 - Quectel EC20/EC25
 - ZTE MF821
 - ZTE MF286
 - ZTE MF286D
 - Huawei E3372/E3276
 - Huawei E3276 HiLink
 - Huawei E5786 (mobile-wifi / HiLink)
 
没有测试完全的设备 (并不是所有的数据都可以显示出来，需要手动修改相关脚本指令等):
 - Sierra Wireless MC7710
 - Sierra Wireless EM7455
 - ASKEY WWHC050
 - BroadMobi BM806U
 - Mikrotik R11e-LTE
 - Mikrotik R11e-LTE6
 - HiLink modems (ZTE / Alcatel)

```

## 安装
``` bash
> 通用模块依赖包.
opkg install kmod-usb-serial kmod-usb-serial-option

> 对于华为HiLink系列模块还需安装以下依赖包.
opkg install wget-nossl

额外需要安装sms-tool(https://github.com/obsy/sms_tool).
opkg install sms-tool_2021-12-03-d38898f4-1_XXX.ipk
如果直接opkg安装后sms-tool命令不能正常使用，需要把sms-tool目录下的Makefile放到openwrt源码package目录下，自行编译后安装可以正常使用。
```




![](https://github.com/4IceG/Personal_data/blob/master/zrzuty/1.0.15-20220325.gif?raw=true)

## 
