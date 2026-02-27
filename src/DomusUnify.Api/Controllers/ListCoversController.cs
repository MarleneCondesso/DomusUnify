using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Geração de imagens de capa (SVG) para listas.
/// </summary>
[ApiController]
[Route("api/v1/list-covers")]
public sealed class ListCoversController : ControllerBase
{
    private const int Width = 1200;
    private const int Height = 800;

    /// <summary>
    /// Devolve uma imagem SVG gerada de forma determinística a partir de uma categoria e seed.
    /// </summary>
    /// <remarks>
    /// Este endpoint é público (sem auth) porque imagens carregadas por CSS/IMG não incluem o header Authorization.
    /// </remarks>
    [HttpGet("svg")]
    [AllowAnonymous]
    [Produces("image/svg+xml")]
    public IActionResult GetSvg([FromQuery] string? category = null, [FromQuery] int seed = 0, [FromQuery] string? accent = null)
    {
        var normalizedCategory = NormalizeCategory(category);
        var normalizedAccent = TryNormalizeHexColor(accent);

        var svg = BuildSvg(normalizedCategory, seed, normalizedAccent);

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        return Content(svg, "image/svg+xml", Encoding.UTF8);
    }

    private static string NormalizeCategory(string? value)
    {
        var raw = (value ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(raw))
            return "generic";

        // Permite apenas letras, números e hífen para evitar injeção.
        var sb = new StringBuilder(raw.Length);
        foreach (var ch in raw)
        {
            if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '-')
                sb.Append(ch);
        }

        var cleaned = sb.ToString();
        return string.IsNullOrWhiteSpace(cleaned) ? "generic" : cleaned;
    }

    private static string? TryNormalizeHexColor(string? value)
    {
        var raw = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (!raw.StartsWith('#'))
            raw = $"#{raw}";

        if (raw.Length != 7)
            return null;

        for (var i = 1; i < raw.Length; i++)
        {
            var c = raw[i];
            var isHex = (c >= '0' && c <= '9') ||
                        (c >= 'a' && c <= 'f') ||
                        (c >= 'A' && c <= 'F');
            if (!isHex) return null;
        }

        return raw.ToUpperInvariant();
    }

    private static string BuildSvg(string category, int seed, string? accent)
    {
        var baseHue = category switch
        {
            "grocery" => 125,
            "cleaning" => 205,
            "school" => 45,
            "cooking" => 18,
            "party" => 330,
            "gift" => 345,
            "diy" => 28,
            "travel" => 215,
            "finance" => 160,
            "fitness" => 275,
            _ => 200
        };

        var rng = new Random(seed);
        var hueA = WrapHue(baseHue + (rng.NextDouble() * 18.0 - 9.0));
        var hueB = WrapHue(baseHue + (rng.NextDouble() * 28.0 - 14.0));

        var bg1 = ToHex(HslToRgb(hueA, 0.62, 0.70));
        var bg2 = ToHex(HslToRgb(hueB, 0.62, 0.30));
        var accentColor = accent ?? ToHex(HslToRgb(WrapHue(baseHue + 8), 0.70, 0.56));
        var accentSoft = Blend(accentColor, "#FFFFFF", 0.55);

        var icon = GetIconMarkup(category);

        return $"""
               <svg xmlns="http://www.w3.org/2000/svg" width="{Width}" height="{Height}" viewBox="0 0 {Width} {Height}">
                 <defs>
                   <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                     <stop offset="0" stop-color="{bg1}" />
                     <stop offset="1" stop-color="{bg2}" />
                   </linearGradient>
                   <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.18" />
                     <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
                   </linearGradient>
                   <filter id="blur24" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="24" />
                   </filter>
                   <filter id="blur10" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="10" />
                   </filter>
                   <filter id="noise" x="-20%" y="-20%" width="140%" height="140%">
                     <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                     <feColorMatrix type="saturate" values="0" />
                     <feComponentTransfer>
                       <feFuncA type="table" tableValues="0 0.10" />
                     </feComponentTransfer>
                   </filter>
                 </defs>

                 <rect width="{Width}" height="{Height}" fill="url(#bg)" />

                 <!-- Bokeh blobs -->
                 <g opacity="0.75" filter="url(#blur24)">
                   <circle cx="200" cy="180" r="160" fill="{accentSoft}" />
                   <circle cx="980" cy="190" r="190" fill="#FFFFFF" opacity="0.25" />
                   <circle cx="1000" cy="620" r="240" fill="{accentSoft}" opacity="0.55" />
                   <circle cx="240" cy="650" r="220" fill="#FFFFFF" opacity="0.18" />
                 </g>

                 <!-- Diagonal shine -->
                 <path d="M-200,140 L760,-180 L1400,360 L440,680 Z" fill="url(#shine)" opacity="0.55" filter="url(#blur10)" />

                 <!-- Subtle noise -->
                 <rect width="{Width}" height="{Height}" filter="url(#noise)" fill="#000000" opacity="0.55" />

                 <!-- Icon watermark -->
                 <g transform="translate(600 360) scale(6)" opacity="0.22" stroke="#FFFFFF" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
                   {icon}
                 </g>
               </svg>
               """;
    }

    private static string GetIconMarkup(string category) => category switch
    {
        "grocery" => """
                     <path d="M-40 -25 H-20 L-10 30 H30 L40 -5 H-5" />
                     <path d="M-10 30 H30" />
                     <circle cx="-5" cy="40" r="7" />
                     <circle cx="25" cy="40" r="7" />
                     """,
        "cleaning" => """
                      <path d="M-35 -35 L25 25" />
                      <path d="M10 10 L40 40" />
                      <path d="M25 25 L45 45" />
                      <path d="M-5 -20 L5 -30" />
                      <path d="M5 -20 L-5 -30" />
                      <path d="M-15 -5 L-5 -15" />
                      <path d="M-5 -5 L-15 -15" />
                      """,
        "school" => """
                    <path d="M-30 25 L15 -20 L30 -5 L-15 40 Z" />
                    <path d="M12 -18 L28 -2" />
                    <path d="M-22 18 L-10 30" />
                    """,
        "cooking" => """
                     <circle cx="0" cy="5" r="26" />
                     <path d="M-32 -30 V10" />
                     <path d="M-24 -30 V-10" />
                     <path d="M-16 -30 V10" />
                     <path d="M30 -30 V40" />
                     <path d="M30 -30 C18 -30 18 -10 30 -10" />
                     """,
        "party" => """
                   <circle cx="-18" cy="-10" r="16" />
                   <circle cx="18" cy="-14" r="16" />
                   <path d="M-18 6 C-26 22 -10 34 -22 52" />
                   <path d="M18 2 C10 22 26 34 14 52" />
                   """,
        "gift" => """
                  <path d="M-30 -12 H30 V40 H-30 Z" />
                  <path d="M0 -12 V40" />
                  <path d="M-30 8 H30" />
                  <path d="M-10 -12 C-26 -36 -4 -38 0 -24 C4 -38 26 -36 10 -12" />
                  """,
        "diy" => """
                 <path d="M-35 -10 L-10 -35 L5 -20 L-20 5 Z" />
                 <path d="M5 -20 L35 10" />
                 <path d="M28 3 L38 13" />
                 <path d="M-5 -10 L10 5" />
                 """,
        "travel" => """
                    <path d="M-45 0 L45 0" />
                    <path d="M-5 0 L-25 -18" />
                    <path d="M-5 0 L-25 18" />
                    <path d="M10 0 L30 -14" />
                    <path d="M10 0 L30 14" />
                    <path d="M-12 0 L0 -38" />
                    """,
        "finance" => """
                     <ellipse cx="0" cy="26" rx="26" ry="9" />
                     <path d="M-26 6 C-26 16 26 16 26 6" />
                     <path d="M-26 6 V26" />
                     <path d="M26 6 V26" />
                     <path d="M-18 -16 H18" />
                     <path d="M-18 -6 H18" />
                     """,
        "fitness" => """
                     <path d="M-40 -8 V8" />
                     <path d="M-30 -14 V14" />
                     <path d="M-30 0 H30" />
                     <path d="M40 -8 V8" />
                     <path d="M30 -14 V14" />
                     """,
        _ => """
             <path d="M-26 -26 H26 V26 H-26 Z" />
             <path d="M-26 0 H26" />
             <path d="M0 -26 V26" />
             """
    };

    private static double WrapHue(double hue)
    {
        var h = hue % 360.0;
        return h < 0 ? h + 360.0 : h;
    }

    private static (int r, int g, int b) HslToRgb(double hue, double saturation, double lightness)
    {
        // Algoritmo HSL -> RGB (0-1)
        var c = (1 - Math.Abs(2 * lightness - 1)) * saturation;
        var x = c * (1 - Math.Abs((hue / 60.0) % 2 - 1));
        var m = lightness - c / 2;

        (double r1, double g1, double b1) = hue switch
        {
            < 60 => (c, x, 0.0),
            < 120 => (x, c, 0.0),
            < 180 => (0.0, c, x),
            < 240 => (0.0, x, c),
            < 300 => (x, 0.0, c),
            _ => (c, 0.0, x)
        };

        var r = (int)Math.Round((r1 + m) * 255);
        var g = (int)Math.Round((g1 + m) * 255);
        var b = (int)Math.Round((b1 + m) * 255);

        return (ClampByte(r), ClampByte(g), ClampByte(b));
    }

    private static string ToHex((int r, int g, int b) rgb)
        => $"#{rgb.r:X2}{rgb.g:X2}{rgb.b:X2}";

    private static string Blend(string hexA, string hexB, double t)
    {
        var a = ParseHex(hexA);
        var b = ParseHex(hexB);
        var r = (int)Math.Round(a.r + (b.r - a.r) * t);
        var g = (int)Math.Round(a.g + (b.g - a.g) * t);
        var b2 = (int)Math.Round(a.b + (b.b - a.b) * t);
        return $"#{ClampByte(r):X2}{ClampByte(g):X2}{ClampByte(b2):X2}";
    }

    private static (int r, int g, int b) ParseHex(string hex)
    {
        var raw = hex.StartsWith('#') ? hex[1..] : hex;
        if (raw.Length != 6)
            return (0, 0, 0);

        var r = int.Parse(raw[..2], NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        var g = int.Parse(raw.Substring(2, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        var b = int.Parse(raw.Substring(4, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
        return (r, g, b);
    }

    private static int ClampByte(int value) => value < 0 ? 0 : value > 255 ? 255 : value;
}
