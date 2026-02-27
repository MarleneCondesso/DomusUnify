using DomusUnify.Application.Common.Covers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;

namespace DomusUnify.Api.Services.Covers;

/// <summary>
/// Provider de fotos stock via Pexels API (https://www.pexels.com/api/).
/// </summary>
public sealed class PexelsStockPhotoProvider : IStockPhotoProvider
{
    private readonly HttpClient _http;
    private readonly IConfiguration _cfg;
    private readonly ILogger<PexelsStockPhotoProvider> _logger;

    public PexelsStockPhotoProvider(HttpClient http, IConfiguration cfg, ILogger<PexelsStockPhotoProvider> logger)
    {
        _http = http;
        _cfg = cfg;
        _logger = logger;
    }

    public async Task<string?> TryGetPhotoUrlAsync(string query, int seed, CancellationToken ct)
    {
        var apiKey = _cfg["StockImages:Pexels:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        var q = (query ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(q))
            return null;

        var url =
            $"search?query={Uri.EscapeDataString(q)}" +
            "&orientation=landscape" +
            "&per_page=30";

        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.TryAddWithoutValidation("Authorization", apiKey);

        try
        {
            using var resp = await _http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
                return null;

            var data = await resp.Content.ReadFromJsonAsync<PexelsSearchResponse>(cancellationToken: ct);
            var photos = data?.Photos;
            if (photos is null || photos.Count == 0)
                return null;

            var tokens = ExtractKeywords(q);
            var candidates = PickBestCandidates(photos, tokens);
            if (candidates.Count == 0)
                return null;

            var take = Math.Min(candidates.Count, 10);
            var idx = Math.Abs(seed) % take;
            var photo = candidates[idx];

            // Preferimos landscape para cards; fallback para outros tamanhos se necessário.
            return photo.Src?.Landscape ?? photo.Src?.Large ?? photo.Src?.Original;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao obter foto do Pexels para query '{Query}'.", q);
            return null;
        }
    }

    private static List<PexelsPhoto> PickBestCandidates(IReadOnlyList<PexelsPhoto> photos, IReadOnlyList<string> tokens)
    {
        var withSrc = photos.Where(p => p.Src is not null).ToList();
        if (withSrc.Count == 0)
            return new List<PexelsPhoto>();

        // Nunca devolver imagens cujo `alt` indica pessoas.
        var noPeople = withSrc.Where(p => !HasPeople(p.Alt)).ToList();
        if (noPeople.Count == 0)
            return new List<PexelsPhoto>();

        if (tokens.Count == 0)
            return noPeople;

        var scored = noPeople.Select(p => (Photo: p, Score: KeywordScore(p.Alt, tokens))).ToList();

        var best = scored.Where(x => x.Score > 0).ToList();
        if (best.Count == 0)
            return noPeople;

        var max = best.Max(x => x.Score);
        return best.Where(x => x.Score == max).Select(x => x.Photo).ToList();
    }

    private static int KeywordScore(string? alt, IReadOnlyList<string> tokens)
    {
        if (string.IsNullOrWhiteSpace(alt))
            return 0;

        var hay = Normalize(alt);
        if (hay.Length == 0)
            return 0;

        var score = 0;
        foreach (var t in tokens)
        {
            if (hay.Contains(t, StringComparison.Ordinal))
                score += t.Length >= 6 ? 2 : 1;
        }

        return score;
    }

    private static bool HasPeople(string? alt)
    {
        if (string.IsNullOrWhiteSpace(alt))
            return false;

        var hay = Normalize(alt);
        if (hay.Length == 0)
            return false;

        // Usamos boundaries por espaços para evitar falsos positivos (ex.: "mandarin" conter "man").
        var padded = $" {hay} ";

        return padded.Contains(" person ", StringComparison.Ordinal) ||
               padded.Contains(" people ", StringComparison.Ordinal) ||
               padded.Contains(" man ", StringComparison.Ordinal) ||
               padded.Contains(" men ", StringComparison.Ordinal) ||
               padded.Contains(" woman ", StringComparison.Ordinal) ||
               padded.Contains(" women ", StringComparison.Ordinal) ||
               padded.Contains(" boy ", StringComparison.Ordinal) ||
               padded.Contains(" boys ", StringComparison.Ordinal) ||
               padded.Contains(" girl ", StringComparison.Ordinal) ||
               padded.Contains(" girls ", StringComparison.Ordinal) ||
               padded.Contains(" child ", StringComparison.Ordinal) ||
               padded.Contains(" children ", StringComparison.Ordinal) ||
               padded.Contains(" kid ", StringComparison.Ordinal) ||
               padded.Contains(" kids ", StringComparison.Ordinal) ||
               padded.Contains(" adult ", StringComparison.Ordinal) ||
               padded.Contains(" adults ", StringComparison.Ordinal) ||
               padded.Contains(" teen ", StringComparison.Ordinal) ||
               padded.Contains(" teens ", StringComparison.Ordinal) ||
               padded.Contains(" baby ", StringComparison.Ordinal) ||
               padded.Contains(" babies ", StringComparison.Ordinal) ||
               padded.Contains(" portrait ", StringComparison.Ordinal) ||
               padded.Contains(" selfie ", StringComparison.Ordinal) ||
               padded.Contains(" face ", StringComparison.Ordinal) ||
               padded.Contains(" smile ", StringComparison.Ordinal) ||
               padded.Contains(" smiling ", StringComparison.Ordinal) ||
               padded.Contains(" couple ", StringComparison.Ordinal) ||
               padded.Contains(" family ", StringComparison.Ordinal);
    }

    private static IReadOnlyList<string> ExtractKeywords(string query)
    {
        var normalized = Normalize(query);
        if (normalized.Length == 0)
            return Array.Empty<string>();

        static bool IsStopWord(string w) => w is
            "a" or "an" or "and" or "or" or "of" or "the" or "to" or "in" or "on" or "with" or "for" or
            "de" or "da" or "do" or "das" or "dos" or "e" or "em" or "para" or "por" or "com" or
            "person" or "people" or "without";

        return normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 3)
            .Where(t => !IsStopWord(t))
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    private static string Normalize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        // Lowercase + remove punctuation (keep letters/digits/spaces) for robust matching.
        var lowered = value.Trim().ToLowerInvariant();
        var sb = new StringBuilder(lowered.Length);
        foreach (var ch in lowered)
        {
            if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch))
                sb.Append(ch);
        }

        return sb.ToString();
    }

    private sealed class PexelsSearchResponse
    {
        [JsonPropertyName("photos")]
        public List<PexelsPhoto> Photos { get; init; } = new();
    }

    private sealed class PexelsPhoto
    {
        [JsonPropertyName("alt")]
        public string? Alt { get; init; }

        [JsonPropertyName("src")]
        public PexelsPhotoSrc? Src { get; init; }
    }

    private sealed class PexelsPhotoSrc
    {
        [JsonPropertyName("original")]
        public string? Original { get; init; }

        [JsonPropertyName("large")]
        public string? Large { get; init; }

        [JsonPropertyName("landscape")]
        public string? Landscape { get; init; }
    }
}
