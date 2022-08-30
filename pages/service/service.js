// pages/service-ble/service-ble.js
import { sdBLE } from "../../utils/sdBLE.js";
const app = getApp();
let sdBLEObj = new sdBLE();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '',
    services: []
  },
  /**
   * 自定义数据
   */
  customData: {
    deviceName: '',
    deviceId: '',
    services: []
  },

  async startGetServices() {
    let res = await sdBLEObj.getBLEDeviceServices(this.customData.deviceId)
    console.log(res)
    this.customData.services = res.data
      this.setData({
        services: res.data
      })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.customData.deviceId = options.deviceId
    this.customData.deviceName = options.deviceName
    this.setData({
      name: options.deviceName
    })
    this.startGetServices() // 获取服务列表

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    sdBLEObj.stopBluetoothDevicesDiscovery()

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    sdBLEObj.endConnect(this.customData.deviceId)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  getCharacteristic(event) {
    if (app.globalData.connectState) {
      const deviceName = this.customData.deviceName;
      const serviceId = event.currentTarget.dataset.uuid;
      const deviceId = this.customData.deviceId;
      wx.navigateTo({
        url: `/pages/characteristic/characteristic?deviceName=${deviceName}&deviceId=${deviceId}&serviceId=${serviceId}`,
      });
    } else {
      wx.showToast({
        title: "未连接蓝牙设备",
        icon: "none",
      });
    }
  }
})