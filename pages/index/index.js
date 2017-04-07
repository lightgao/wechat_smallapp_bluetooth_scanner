//index.js

//获取应用实例
var app = getApp()

Page({

  data: {
    userInfo: {},
    btdevsarray: [],
    discoverying: false,
    tipinfo: ''
  },

  btdevshash: {},

  updateBTDevs: function(dev) {
    console.log(JSON.stringify(dev))

    var devshash = this.btdevshash

    var devid = dev["deviceId"]
    // if (dev["name"] && dev["name"].startsWith("April")) {
      if ( !devshash[devid] ) {
        devshash[devid] = {}

        devshash[devid]["deviceId"] = devid
        devshash[devid]["name"] = dev["name"]
        devshash[devid]["RSSI"] = dev["RSSI"]
        devshash[devid]["advertisData"] = dev["advertisData"]

        devshash[devid]["counter"] = 1
      } else {
        devshash[devid]["counter"] += 1
        console.log("--- found existing", devshash[devid]["counter"])
      }
      devshash[devid]["timestamp"] = Date.now()
    // }
  },

  resetBTDevs: function() {
    for (var k in this.btdevshash) delete this.btdevshash[k];
    this.btdevshash["00:00:00:00:00:00"] = {deviceId: "00:00:00:00:00:00", name: "NULL"}

    this.setData({
      btdevsarray: [{deviceId: "00:00:00:00:00:00", name: "NULL"}],
    })
  },


  onLoad: function () {
    console.log('onLoad')
    var that = this

    app.getUserInfo(function(userInfo){
      that.setData({userInfo:userInfo})
    })

    wx.onBluetoothAdapterStateChange(function(res) {
      console.log("onBluetoothAdapterStateChange, now is", res)
    })

    that.resetBTDevs()
    wx.onBluetoothDeviceFound(function(res) {
      // console.log('onBluetoothDeviceFound: new device list has founded')
      console.log(JSON.stringify(res))

      if (app.getPlatform()=="android") {
        // // ON Andriod: variable 'res' is not array, and only contain one bt device
        that.updateBTDevs(res)
      }

      else if (app.getPlatform()=="ios") {
        // ON IOS: variable 'res' is object with a key "devices" whol is an array
        for (var i in res["devices"]) { that.updateBTDevs(res["devices"][i]) }
      }

      else if (app.getPlatform()=="devtools") {
        // ON Mac Devtools: variable 'res' is an array
        for (var i in res) { that.updateBTDevs(res[i]) }
      }

      //hash to sorted array for UI displaying
      var devsarray = []
      for (var k in that.btdevshash) {
        devsarray.push(that.btdevshash[k])
      }
      devsarray.sort(function(a, b){
        if (a["deviceId"]>b["deviceId"]) return 1
        if (a["deviceId"]<b["deviceId"]) return -1
        return 0
      })
      that.setData({btdevsarray: devsarray})
    })
  },

  onUnload: function () {
    this.toggleBTScanning(turnOn=false)
  },
  

  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  bindViewTapScanBT: function() {
    var that = this
    that.toggleBTScanning()
  },


  toggleBTScanning: function(turnOn=null) {
    var that = this

    function turnOnBTScanning() {

      function startDiscovering() {
        wx.startBluetoothDevicesDiscovery({
          success: function (res) { 
            console.log("startBluetoothDevicesDiscovery:success:", res)

            that.setData({discoverying:true, tipinfo:''})
          },
          fail: function (res) { 
            console.log("startBluetoothDevicesDiscovery:fail:", res)

            // that.setData({tipinfo:'fail to start discovering'})
            that.setData({tipinfo:res["errMsg"]})
          }
        })
      }

      wx.openBluetoothAdapter({
        success: function (res) {
          console.log("openBluetoothAdapter:success", res)

          startDiscovering()
        },
        fail: function (res) {
          console.log("openBluetoothAdapter:fail", res)

          // that.setData({tipinfo:'fail to open bluetooth adapter'})
          that.setData({tipinfo:res["errMsg"]})
        }
      })
    }

    function turnOffBTScanning() {      
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("stopBluetoothDevicesDiscovery:success", res)

          wx.closeBluetoothAdapter({
            success: function (res) {
              console.log("closeBluetoothAdapter:success:", res)

              that.setData({discoverying:false, tipinfo:''})
              // that.resetBTDevs()
            },
            fail: function (res) {
              console.log("closeBluetoothAdapter:fail:", res)

              // that.setData({tipinfo:'fail to close bluetooth adapter'})
              that.setData({tipinfo:res["errMsg"]})
            }
          })
        },
        fail: function (res) { 
          console.log("stopBluetoothDevicesDiscovery:fail:", res)
          
          // that.setData({tipinfo:'fail to stop discovering'})
          that.setData({tipinfo:res["errMsg"]})
        }
      })
    }

    if (turnOn==null) {
      // wx.getBluetoothAdapterState({
      //   success: function (adapterState, errMsg) {
      //     console.log("getBluetoothAdapterState:success", adapterState)
      //     adapterState.discovering ?  turnOffBTScanning() : turnOnBTScanning()
      //   },
      //   fail: function(res) {
      //     console.log("getBluetoothAdapterState:fail", res)
      //   }
      // })

      that.data.discoverying ? turnOffBTScanning() : turnOnBTScanning()
    } else {
      turnOn ? turnOnBTScanning() : turnOffBTScanning()
    }
  },

})
