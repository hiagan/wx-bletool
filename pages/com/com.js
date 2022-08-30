// pages/com/com.js
import { sdBLE } from "../../utils/sdBLE.js";
const app = getApp();
let sdBLEObj = new sdBLE();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    receiverText: '',
    receiverLength: 0,
    sendText: '',
    sendLength: 0,
    time: 1000,
    timeSend: false,
  },
  /**
   * 自定义数据
   */
  customData: {
    sendText: '',
    deviceId: '',
    serviceId: '',
    characteristicId: '',
    canWrite: false,
    canRead: false,
    canNotify: false,
    canIndicate: false,
    time: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.customData.deviceId = options.deviceId
    this.customData.serviceId = options.serviceId
    this.customData.characteristicId = options.characteristicId
    this.customData.canWrite = options.write === 'true' ? true : false
    this.customData.canRead = options.read === 'true' ? true : false
    this.customData.canNotify = options.notify === 'true' ? true : false
    this.customData.canIndicate = options.indicate === 'true' ? true : false
    /**
     * 如果支持notify
     */
    if (options.notify) {
      wx.notifyBLECharacteristicValueChange({
        deviceId: options.deviceId,
        serviceId: options.serviceId,
        characteristicId: options.characteristicId,
        state: true,
        success: (res) => {
          // do something...
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    
    sdBLEObj.onBLECharacteristicValueChange((receiverText)=>{
      this.setData({
        receiverLength: this.data.receiverLength + receiverText.length
      })
      setTimeout(() => {
        this.setData({
          receiverText: (this.data.receiverText + receiverText).substr(-4000, 4000)
        })
      }, 200)
    })
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
    this.setData({
      receiverText: '',
      receiverLength: 0,
      sendText: '',
      sendLength: 0,
      time: 1000,
      timeSend: false
    })
  },

  /**
   * 更新发送框内容
   */
  updateSendText(event) {
    const value = event.detail.value
    this.customData.sendText = value
    this.setData({
      sendText: value
    })
  },

  /**
   * 更新定时发送时间间隔
   */
  updateTime(event) {
    const self = this
    const value = event.detail.value
    this.setData({
      time: /^[1-9]+.?[0-9]*$/.test(value) ? +value : 1000
    })
    clearInterval(this.customData.time)
    const deviceId = this.customData.deviceId // 设备ID
    const serviceId = this.customData.serviceId // 服务ID
    const characteristicId = this.customData.characteristicId // 特征值ID
    this.customData.time = setInterval(() => {
      const sendText = self.customData.sendText
      const sendPackage = app.subPackage(sendText) // 数据分每20个字节一个数据包数组
      if (app.globalData.connectState) {
        if (self.customData.canWrite) { // 可写
          self.writeData({ deviceId, serviceId, characteristicId, sendPackage })
        }
      }
    }, self.data.time)
  },
  /**
   * 清除接收
   */
  clearReceiverText(event) {
    // this.customData.receiverText = ''
    this.setData({
      receiverText: '',
      receiverLength: 0,
      sendLength: 0
    })
  },
  /**
   * 清除发送
   */
  clearSendText(event) {
    this.customData.sendText = ''
    this.setData({
      sendText: '',
      sendLength: 0
    })
  },
  /**
   * 手动发送
   */
  manualSend(event) {
    const deviceId = this.customData.deviceId // 设备ID
    const serviceId = this.customData.serviceId // 服务ID
    const characteristicId = this.customData.characteristicId // 特征值ID
    const sendText = this.customData.sendText
    const sendPackage = app.subPackage(sendText) // 数据分每20个字节一个数据包数组
    if (app.globalData.connectState) {
      if (this.customData.canWrite) { // 可写
        this.writeData({ deviceId, serviceId, characteristicId, sendPackage })
      }
    } else {
      wx.showToast({
        title: '已断开连接',
        icon: 'none'
      })
    }
  },
  /**
   * 自动发送
   */
  timeChange (event) {
    this.setData({
      timeSend: event.detail.value.length ? true : false
    })
    if (!this.data.timeSend) {
      clearInterval(this.customData.time)
    } else {
      const self = this
      const deviceId = this.customData.deviceId // 设备ID
      const serviceId = this.customData.serviceId // 服务ID
      const characteristicId = this.customData.characteristicId // 特征值ID
      this.customData.time = setInterval(() => {
        const sendText = self.customData.sendText
        const sendPackage = app.subPackage(sendText) // 数据分每20个字节一个数据包数组
        if (app.globalData.connectState) {
          if (self.customData.canWrite) { // 可写
            self.writeData({ deviceId, serviceId, characteristicId, sendPackage })
          }
        }
      }, self.data.time)
    }
  },
  /**
   * 向特征值写数据(write)
   */
  writeData ({deviceId, serviceId, characteristicId, sendPackage, index = 0}) {
    const self = this
    let i = index;
    let len = sendPackage.length;
    if (len && len > i) {
      wx.writeBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId,
        value: app.string2buf(sendPackage[i]),
        success:  (res) => {
          self.setData({
            sendLength: self.data.sendLength + sendPackage[i].length // 更新已发送字节数
          })
          i += 1;
          self.writeData({deviceId, serviceId, characteristicId, sendPackage, index: i}) // 发送成功，发送下一个数据包
        },
        fail: (res) => {
          self.writeData({deviceId, serviceId, characteristicId, sendPackage, index}) // 发送失败，重新发送
        }
      })
    }
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

  }
})