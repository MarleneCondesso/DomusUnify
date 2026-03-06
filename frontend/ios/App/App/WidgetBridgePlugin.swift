import Capacitor
import Foundation
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "syncState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshWidgets", returnType: CAPPluginReturnPromise),
    ]

    @objc func syncState(_ call: CAPPluginCall) {
        let keys = Set(call.options.keys)

        WidgetDefaults.merge(
            hasAccessToken: keys.contains("accessToken"),
            accessToken: call.getString("accessToken"),
            hasFamilyId: keys.contains("familyId"),
            familyId: call.getString("familyId"),
            hasApiOrigin: keys.contains("apiOrigin"),
            apiOrigin: call.getString("apiOrigin")
        )

        reloadTimelines()
        call.resolve()
    }

    @objc func clearState(_ call: CAPPluginCall) {
        WidgetDefaults.clear()
        reloadTimelines()
        call.resolve()
    }

    @objc func refreshWidgets(_ call: CAPPluginCall) {
        reloadTimelines()
        call.resolve()
    }

    private func reloadTimelines() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
