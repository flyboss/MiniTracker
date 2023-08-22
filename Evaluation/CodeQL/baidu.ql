// https://github1s.com/github/codeql/blob/main/javascript/ql/examples/queries/dataflow/EvalTaint/EvalTaint.ql
// https://github1s.com/github/codeql/blob/main/javascript/ql/examples/queries/dataflow/BackendIdor/BackendIdor.ql
import javascript
import DataFlow::PathGraph

class MyConfiguration extends TaintTracking::Configuration {
  MyConfiguration() { this = "MyConfiguration" }

  override predicate isSource(DataFlow::Node source) {
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getUserInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("getSystemInfoSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getSystemInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("downloadFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("MapContext.getCenterLocation")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("MapContext.getRegion")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getImageInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("chooseImage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("compressImage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("chooseVideo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getAvailableAudioSources")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("getStorageSync") or
    source = DataFlow::globalVarRef("swan").getAMemberCall("getStorageInfoSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getStorageInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("CameraContext.startRecord")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("CameraContext.takePhoto")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getLocation")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getSavedFileList")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getSavedFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.getFileInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.getSavedFileList")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.readdir")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("FileSystemManager.readdirSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.readFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("FileSystemManager.readFileSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("openSetting")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getSetting")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("chooseAddress")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("chooseInvoiceTitle")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("getBatteryInfoSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getBatteryInfo")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getClipboardData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getNetworkType")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source = DataFlow::globalVarRef("swan").getAMemberCall("getExtConfigSync") or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("getExtConfig")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("NodesRef.fields")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("NodesRef.scrollOffset")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0) or
    source =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("input")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertySource("success")
          .(DataFlow::FunctionNode)
          .getParameter(0)
  }

  override predicate isSink(DataFlow::Node sink) {
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("request")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("uploadFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("sendSocketMessage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("connectSocket")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("SocketTask.send")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("swan").getAMemberCall("setStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("setStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("swan").getAMemberCall("removeStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("removeStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink = DataFlow::globalVarRef("swan").getAMemberCall("clearStorageSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("clearStorage")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("saveImageToPhotosAlbum")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("saveVideoToPhotosAlbum")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("saveFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("removeSavedFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.appendFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.appendFileSync")
          .getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.copyFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.copyFileSync")
          .getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.removeSavedFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.rmdir")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan").getAMemberCall("FileSystemManager.rmdirSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.saveFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.saveFileSync")
          .getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.unlink")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan").getAMemberCall("FileSystemManager.unlinkSync").getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.writeFile")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("FileSystemManager.writeFileSync")
          .getAnArgument() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("authorize")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("addPhoneContact")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs() or
    sink =
      DataFlow::globalVarRef("swan")
          .getAMemberCall("setClipboardData")
          .getArgument(0)
          .(DataFlow::ObjectLiteralNode)
          .getAPropertyWrite()
          .getRhs()
  }
}

from MyConfiguration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink)
select source, sink
