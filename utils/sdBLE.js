/**
 * 蓝牙BLE操作类
 * @author hiagan
 */
class sdBLE {
  constructor() {
    this.devs = [];
    this.globalData = getApp().globalData;
    this.globalData.bluetoothState = false; // 蓝牙适配器状态
    this.globalData.connectState = false;
  }

  /**
   * 等待
   * @param {*} i millisecond
   */
  wait(i) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, i);
    });
  }
  /**
   * 微信蓝牙模块初始化
   */
  openBluetoothAdapter() {
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: (res) => {
          this.globalData.bluetoothState = true;
          resolve({ ok: true, errCode: 0, errMsg: "" });
        },
        fail: (res) => {
          this.globalData.bluetoothState = false;
          console.log("openBluetoothAdapter fail ", res);
          resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg });
        },
      });
    });
  }
  /**
   * 关闭蓝牙适配器
   */
  closeBluetoothAdapter() {
    return new Promise((resolve, reject) => {
      wx.closeBluetoothAdapter({
        success: (res) => {
          resolve({ ok: true, errCode: 0, errMsg: "" });
        },
        fail: (res) => {
          resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg });
        },
      });
    });
  }
  /**
   * 监听蓝牙适配器状态变化
   */
  onBluetoothAdapterStateChange() {
    wx.onBluetoothAdapterStateChange((res) => {
      // console.log('search.js[onLoad]: onBluetoothAdapterStateChange')
      if (res.available) {
        // console.log('search.js[onLoad]: BluetoothState is true')
        this.globalData.bluetoothState = true;
        wx.openBluetoothAdapter({
          success: (res) => {
            this.globalData.bluetoothState = true;
            wx.hideLoading();
          },
        });
      } else {
        // console.log('search.js[onLoad]: BluetoothState is false')
        this.globalData.bluetoothState = false;
        this.globalData.connectState = false;
        wx.showLoading({
          title: "请开启手机蓝牙",
        });
      }
    });
  }
  /**
   * 监听BLE蓝牙连接状态变化
   */
  onBLEConnectionStateChange() {
    wx.onBLEConnectionStateChange((res) => {
      if (res.connected) {
        // console.log('connected')
        wx.hideLoading();
        wx.showToast({
          title: "连接成功",
          icon: "success",
          success: (res) => {
            this.globalData.connectState = true;
          },
        });
      } else {
        // console.log('disconnect')
        wx.hideLoading();
        wx.showToast({
          title: "已断开连接",
          icon: "none",
          success: (res) => {
            this.globalData.connectState = false;
          },
        });
      }
    });
  }

  /**
   * 搜索蓝牙设备
   * @param {r} cb 回调函数callback 主要使用是把参数传递出去
   */
  startBluetoothDevicesDiscovery(callback) {
    let _devs = [];
    var ctx = this;
    wx.startBluetoothDevicesDiscovery({
      //开启搜索
      allowDuplicatesKey: true,
      success: (res) => {
        wx.onBluetoothDeviceFound((devices) => {
          //console.log("onBluetoothDeviceFound ", devices)
          let isExist = false;
          if (devices.deviceId) {
            for (let item of _devs) {
              if (item.deviceId === devices.deviceId) {
                isExist = true;
                break;
              }
            }
            if (!isExist && devices.name != "") {
              _devs.push(devices);
              ctx.devs.push(devices);
              callback(devices.name, devices.RSSI, devices.deviceId);
            }
          } else if (devices.devices) {
            for (let item of _devs) {
              if (item.deviceId === devices.devices[0].deviceId) {
                isExist = true;
                break;
              }
            }
            if (!isExist && devices.devices[0].name != "") {
              _devs.push(devices.devices[0]);
              ctx.devs.push(devices.devices[0]);
              callback(
                devices.devices[0].name,
                devices.devices[0].RSSI,
                devices.devices[0].deviceId
              );
            }
          } else if (devices[0]) {
            for (let item of _devs) {
              if (item.deviceId === devices[0].deviceId) {
                isExist = true;
                break;
              }
            }
            if (!isExist && devices[0].name != "") {
              _devs.push(devices[0]);
              ctx.devs.push(devices[0]);
              callback(devices[0].name, devices[0].RSSI, devices[0].deviceId);
            }
          }
        });
      },
    });
  }

  /**
   * 停止蓝牙扫描
   */
  stopBluetoothDevicesDiscovery() {
    return new Promise((resolve, reject) => {
      //停止扫描
      wx.stopBluetoothDevicesDiscovery({
        success: (res) => {
          resolve({ ok: true, errCode: 0, errMsg: "" });
        },
        fail: (res) => {
          resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg });
        },
      });
    });
  }

  /**
   * onclick开始连接
   */
  startConnect(deviceId, deviceName = "未知设备") {
    if (this.globalData.bluetoothState) {
      wx.createBLEConnection({
        deviceId: deviceId,
        timeout: 10000, // 10s连接超时
        success: (res) => {
          wx.navigateTo({
            url: `/pages/service/service?deviceId=${deviceId}&deviceName=${deviceName}`,
          });
        },
      });
    }
  }

  /**
   * 断开连接
   */
  endConnect(deviceId) {
    if (this.globalData.bluetoothState) {
      wx.closeBLEConnection({
        deviceId: deviceId,
        success: (res) => {},
      });
    }
  }

  /**
   * 获取蓝牙设备服务列表
   * 需要已经通过 wx.createBLEConnection 建立连接
   * @param deviceId
   */
  getBLEDeviceServices(deviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: (res) => {
          const services = res.services.filter((item, i) => {
            return !/^000018/.test(item.uuid);
          });
          resolve({ ok: true, errCode: 0, errMsg: "", data: services });
        },
        fail: (res) => {
          wx.showToast({
            title: "设备服务获取失败",
            icon: "none",
          });
          resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg });
        },
      });
    });
  }

  /**
   * 获取蓝牙的特征值
   * @param {*} deviceId
   * @param {*} serviceId
   */
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: (res) => {
          resolve({
            ok: true,
            errCode: 0,
            errMsg: "",
            data: res.characteristics,
          });
        },
        fail: (res) => {
          wx.showToast({
            title: "设备特征值获取失败",
            icon: "none",
          });
          resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg });
        },
      });
    });
  }

  /**
   * 监听蓝牙特征值变化：比如有数据发送过来时展示数据
   * @param {*} callback 主用用于把参数传出去
   */
  onBLECharacteristicValueChange(callback) {
    wx.onBLECharacteristicValueChange((res) => {
      console.log("onBLECharacter", res)
      let receiverText = this.buf2string(res.value)
      callback(receiverText);
    });
  }
/**
 * BLE蓝牙特征值写数据：向蓝牙发送数据
 * @param {*} deviceId  蓝牙设备ID
 * @param {*} serviceId 蓝牙特征对应服务的 UUID
 * @param {*} writeCharacteristicId  蓝牙特征的UUID
 * @param {*} sendPackage 发送的数据包
 * @param {*} index 
 */
  writeBLECharacteristicValue(deviceId, serviceId, writeCharacteristicId,sendPackage, index = 0) {
    let i = index;
    let len = sendPackage.length;
    return new Promise((resolve, reject) => {
      if (!len || len  <= i) {
        resolve({ ok: false, errCode: 0, errMsg: '数据长度为：'+ len })
      }
      wx.writeBLECharacteristicValue({
          deviceId: deviceId,
          serviceId: serviceId,
          characteristicId: writeCharacteristicId,
          value: data,
          success(res) {
              resolve({ ok: true, errCode: 0, errMsg: '' })
          },
          fail(res) {
              resolve({ ok: false, errCode: res.errCode, errMsg: res.errMsg })
          }
      })
  })
  }

  /**
   * buf to string
   * @param {*} buffer 
   */
  buf2string(buffer) {
    var arr = Array.prototype.map.call(new Uint8Array(buffer), (x) => x);
    return arr
      .map((char, i) => {
        return String.fromCharCode(char);
      })
      .join("");
  }
}

export { sdBLE };
