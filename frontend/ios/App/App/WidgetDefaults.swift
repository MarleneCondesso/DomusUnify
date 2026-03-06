import Foundation

enum WidgetDefaults {
    static let suiteName = "group.com.domusunify.app"
    static let accessTokenKey = "access_token"
    static let familyIdKey = "family_id"
    static let apiOriginKey = "api_origin"

    static var userDefaults: UserDefaults {
        UserDefaults(suiteName: suiteName) ?? .standard
    }

    static func merge(
        hasAccessToken: Bool,
        accessToken: String?,
        hasFamilyId: Bool,
        familyId: String?,
        hasApiOrigin: Bool,
        apiOrigin: String?
    ) {
        let defaults = userDefaults

        if hasAccessToken {
            write(defaults: defaults, key: accessTokenKey, value: normalize(accessToken))
        }

        if hasFamilyId {
            write(defaults: defaults, key: familyIdKey, value: normalize(familyId))
        }

        if hasApiOrigin {
            write(defaults: defaults, key: apiOriginKey, value: normalizeApiOrigin(apiOrigin))
        }
    }

    static func clear() {
        let defaults = userDefaults
        defaults.removeObject(forKey: accessTokenKey)
        defaults.removeObject(forKey: familyIdKey)
        defaults.removeObject(forKey: apiOriginKey)
    }

    private static func write(defaults: UserDefaults, key: String, value: String?) {
        if let value, !value.isEmpty {
            defaults.set(value, forKey: key)
        } else {
            defaults.removeObject(forKey: key)
        }
    }

    private static func normalize(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed?.isEmpty == false ? trimmed : nil
    }

    private static func normalizeApiOrigin(_ value: String?) -> String? {
        guard let normalized = normalize(value) else { return nil }
        return normalized.replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
    }
}
