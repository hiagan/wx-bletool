// pages/search-dev/search-dev.js
import { sdBLE } from "../../utils/sdBLE.js";
const app = getApp();
let sdBLEObj = new sdBLE();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    devs: [],
  },
  customData: {
    _devs: [],
  },
  async startDiscovery(){
    sdBLEObj.onBluetoothAdapterStateChange()
    sdBLEObj.onBLEConnectionStateChange()
    await sdBLEObj.closeBluetoothAdapter();
    let res = await sdBLEObj.openBluetoothAdapter();
    if (res.ok) {
      sdBLEObj.startBluetoothDevicesDiscovery((name, RSSI, deviceId) => {
        this.customData._devs.push({
          name: name,
          RSSI: RSSI,
          deviceId: deviceId,
        });
        this.setData({ devs: this.customData._devs });
      });

    }
    
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.startDiscovery()
    
  },

  

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    sdBLEObj.stopBluetoothDevicesDiscovery()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    
    console.log("state",sdBLEObj.globalData.bluetoothState)
    if (sdBLEObj.globalData.bluetoothState) {
      
      this.customData._devs = [];
      this.setData({devs:[]});
      setTimeout(() => {
        wx.stopPullDownRefresh();
        this.startDiscovery()
      }, 2000)
    } else {
      wx.showLoading({
        title: "请开启手机蓝牙",
      });
    }
    
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: 'BLE串口助手'
        })
      }, 2000)
    })
    return {
      title: 'BLE串口助手',
      path: '/page/search/search',
      promise 
    }
  },

  onShareTimeline() {
    return {
      title: 'BLE串口助手',
      query: 'name=ble',
      imageUrl: ''
    }
  },
   /**
   * 选择设备连接
   */
  connect (event) {
    if (sdBLEObj.globalData.bluetoothState) {
      const deviceId = event.currentTarget.dataset.dev.deviceId
      const deviceName = event.currentTarget.dataset.dev.name
      wx.showLoading({
        title: '正在连接...',
      })
      sdBLEObj.startConnect(deviceId, deviceName)
    }
  },
});
