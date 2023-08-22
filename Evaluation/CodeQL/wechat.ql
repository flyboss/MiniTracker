// https://github1s.com/github/codeql/blob/main/javascript/ql/examples/queries/dataflow/EvalTaint/EvalTaint.ql
// https://github1s.com/github/codeql/blob/main/javascript/ql/examples/queries/dataflow/BackendIdor/BackendIdor.ql
import javascript
import DataFlow::PathGraph

class MyConfiguration extends TaintTracking::Configuration {
  MyConfiguration() { this = "MyConfiguration" }

  override predicate isSource(DataFlow::Node source) {
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getUserInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("onChange")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getSystemInfoSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getSystemInfoAsync")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getSystemInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getLaunchOptionsSync") or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getEnterOptionsSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Animation.export")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("downloadFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBackgroundFetchToken")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBackgroundFetchData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("MapContext.getCenterLocation")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("MapContext.fromScreenLocation")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("MapContext.getRegion")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getStorageSync") or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getStorageInfoSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getStorageInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getImageInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("compressImage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseImage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseMessageFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getVideoInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("compressVideo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseVideo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseMedia")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getAvailableAudioSources")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBackgroundAudioPlayerState")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("LivePlayerContext.snapshot")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("startRecord")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("CameraContext.startRecord")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("CameraContext.takePhoto")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.getContents")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.getSelectionText")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("MediaContainer.export")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("startLocationUpdateBackground")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getLocation")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getShareInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Canvas.toDataURL")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getSavedFileList")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getSavedFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.fstat")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.fstatSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.getFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.getSavedFileList")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.read")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.readdir")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.readdirSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.readFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.readFileSync") or
    source = DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.readSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("login")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getAccountInfoSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getUserProfile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getUserInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getExptInfoSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("openSetting")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getSetting")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseAddress")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("openCard")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseInvoiceTitle")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseInvoice")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getWeRunData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getPerformance")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EntryList.getEntries")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EntryList.getEntriesByName")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EntryList.getEntriesByType")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Performance.getEntries")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Performance.getEntriesByName")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Performance.getEntriesByType")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getGroupEnterInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBeacons")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getHCEState")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("IsoDep.getHistoricalBytes")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcA.getAtqa")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcA.getSak")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getWifiList")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getConnectedWifi")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("searchContacts")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("chooseContact")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("readBLECharacteristicValue")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBLEDeviceServices")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBLEDeviceRSSI")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBLEDeviceCharacteristics")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getBatteryInfoSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getBatteryInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getClipboardData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getNetworkType")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("wx").getAMemberCall("getExtConfigSync") or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("getExtConfig")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NodesRef.fields")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NodesRef.scrollOffset")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("input")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0)
  }

  override predicate isSink(DataFlow::Node sink) {
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("request")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeLogManager.error")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeLogManager.info")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeLogManager.warn")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeTagLogManager.error")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeTagLogManager.info")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("RealtimeTagLogManager.warn")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("uploadFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("sendSocketMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("connectSocket")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("SocketTask.send")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("wx").getAMemberCall("setStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("setStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("wx").getAMemberCall("removeStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("removeStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("wx").getAMemberCall("clearStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("clearStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("saveImageToPhotosAlbum")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("saveVideoToPhotosAlbum")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("LivePusherContext.sendMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.clear")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.insertImage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.insertText")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.redo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.setContents")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("EditorContext.undo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("saveFileToDisk")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("saveFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("removeSavedFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.appendFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.appendFileSync")
          .getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.copyFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.copyFileSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.removeSavedFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.rmdir")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.rmdirSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.saveFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.saveFileSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.unlink")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.unlinkSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.write")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("FileSystemManager.writeFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.writeFileSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx").getAMemberCall("FileSystemManager.writeSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("requestPayment")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("requestOrderPayment")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("authorizeForMiniProgram")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("authorize")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("shareToWeRun")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("reportPerformance")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("requestSubscribeMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("BLEPeripheralServer.writeCharacteristicValue")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("sendHCEMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("IsoDep.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("MifareClassic.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcA.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcB.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcF.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("NfcV.transceive")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("addPhoneContact")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("writeBLECharacteristicValue")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("setClipboardData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("wx")
          .getAMemberCall("Worker.postMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs()
  }
}

from MyConfiguration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink)
select source, sink
