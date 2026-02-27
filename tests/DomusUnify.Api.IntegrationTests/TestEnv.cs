namespace DomusUnify.Api.IntegrationTests;

internal static class TestEnv
{
    private static int _loaded;

    public static void Load()
    {
        if (Interlocked.Exchange(ref _loaded, 1) == 1) return;

        var repoRoot = FindRepoRoot();
        var envPath = Path.Combine(repoRoot, ".env.test");

        if (!File.Exists(envPath)) return;

        foreach (var rawLine in File.ReadAllLines(envPath))
        {
            var line = rawLine.Trim();

            if (line.Length == 0) continue;
            if (line.StartsWith('#')) continue;

            var idx = line.IndexOf('=');
            if (idx <= 0) continue;

            var key = line[..idx].Trim();
            var value = line[(idx + 1)..].Trim();

            if (key.Length == 0) continue;
            if (Environment.GetEnvironmentVariable(key) is not null) continue;

            // Remove quotes: KEY="value" or KEY='value'
            if (value.Length >= 2 &&
                ((value.StartsWith('"') && value.EndsWith('"')) || (value.StartsWith('\'') && value.EndsWith('\''))))
            {
                value = value[1..^1];
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    public static string Get(string key, string fallback)
    {
        Load();
        return Environment.GetEnvironmentVariable(key) ?? fallback;
    }

    public static bool GetBool(string key, bool fallback)
    {
        Load();
        var raw = Environment.GetEnvironmentVariable(key);
        if (string.IsNullOrWhiteSpace(raw)) return fallback;

        if (bool.TryParse(raw, out var b)) return b;
        if (string.Equals(raw, "1", StringComparison.Ordinal)) return true;
        if (string.Equals(raw, "0", StringComparison.Ordinal)) return false;

        return fallback;
    }

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "DomusUnify.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        return Directory.GetCurrentDirectory();
    }
}

