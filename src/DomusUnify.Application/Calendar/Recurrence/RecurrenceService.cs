using System.Globalization;
using DomusUnify.Application.Calendar.Models;
using DomusUnify.Domain.Entities;

namespace DomusUnify.Application.Calendar;

/// <summary>
/// Implementação do serviço de recorrências do calendário.
/// </summary>
/// <remarks>
/// Esta implementação suporta um subconjunto de <c>RRULE</c> (iCalendar) e limita a iteração ao intervalo pedido
/// para evitar expansões infinitas.
/// </remarks>
public sealed class RecurrenceService : IRecurrenceService
{
    /// <inheritdoc />
    public IReadOnlyList<CalendarOccurrence> ExpandOccurrences(
        CalendarEvent parent,
        IReadOnlyList<CalendarEvent> exceptions,
        DateTime fromUtc,
        DateTime toUtc)
    {
        var result = new List<CalendarOccurrence>();

        // evento não recorrente
        if (string.IsNullOrWhiteSpace(parent.RecurrenceRule))
        {
            if (Overlaps(parent.StartUtc, parent.EndUtc, fromUtc, toUtc))
            {
                result.Add(new CalendarOccurrence(
                    parent.Id, null, parent.StartUtc, parent.EndUtc, parent.IsCancelled));
            }
            return result;
        }

        var rule = RRule.Parse(parent.RecurrenceRule!);

        // duração constante (boa prática)
        var duration = parent.EndUtc - parent.StartUtc;

        // limites
        var until = parent.RecurrenceUntilUtc ?? rule.UntilUtc;
        var count = parent.RecurrenceCount ?? rule.Count;

        // exceções indexadas pela data/hora da ocorrência original (StartUtc do dia/instância)
        // Convenção: a exceção tem StartUtc igual à ocorrência alvo (ou seja, mesma “ocorrência”)
        var exByKey = exceptions
            .Where(e => e.ParentEventId == parent.Id)
            .ToDictionary(e => e.StartUtc, e => e);

        int produced = 0;

        foreach (var occStart in IterateStarts(parent.StartUtc, rule, until, count, toUtc))
        {
            var occEnd = occStart + duration;

            // range
            if (!Overlaps(occStart, occEnd, fromUtc, toUtc))
                continue;

            // exceção?
            if (exByKey.TryGetValue(occStart, out var ex))
            {
                result.Add(new CalendarOccurrence(
                    parent.Id,
                    ex.Id,
                    ex.StartUtc,
                    ex.EndUtc,
                    ex.IsCancelled
                ));
            }
            else
            {
                result.Add(new CalendarOccurrence(
                    parent.Id,
                    null,
                    occStart,
                    occEnd,
                    false
                ));
            }

            produced++;
            if (count.HasValue && produced >= count.Value)
                break;
        }

        return result.OrderBy(x => x.OccurrenceStartUtc).ToList();
    }

    /// <summary>
    /// Indica se dois intervalos temporais se intersectam.
    /// </summary>
    /// <param name="s1">Início do primeiro intervalo.</param>
    /// <param name="e1">Fim do primeiro intervalo.</param>
    /// <param name="s2">Início do segundo intervalo.</param>
    /// <param name="e2">Fim do segundo intervalo.</param>
    /// <returns><see langword="true"/> se existir interseção; caso contrário, <see langword="false"/>.</returns>
    private static bool Overlaps(DateTime s1, DateTime e1, DateTime s2, DateTime e2)
        => s1 < e2 && e1 > s2;

    // ---------------- RRULE subset ----------------

    /// <summary>
    /// Representação mínima de uma regra de recorrência (<c>RRULE</c>).
    /// </summary>
    private sealed class RRule
    {
        /// <summary>
        /// Frequência da recorrência.
        /// </summary>
        public string Freq { get; init; } = "DAILY"; // DAILY/WEEKLY/MONTHLY/YEARLY

        /// <summary>
        /// Intervalo da recorrência (ex.: de 2 em 2 semanas).
        /// </summary>
        public int Interval { get; init; } = 1;

        /// <summary>
        /// Conjunto de dias da semana aplicável a regras <c>WEEKLY</c>.
        /// </summary>
        public HashSet<DayOfWeek>? ByDay { get; init; } // para WEEKLY

        /// <summary>
        /// Data/hora limite (UTC) até à qual a recorrência é gerada.
        /// </summary>
        public DateTime? UntilUtc { get; init; }

        /// <summary>
        /// Número máximo de ocorrências a gerar.
        /// </summary>
        public int? Count { get; init; }

        /// <summary>
        /// Converte uma string <c>RRULE</c> numa instância de <see cref="RRule"/>.
        /// </summary>
        /// <param name="rrule">Regra no formato iCalendar.</param>
        /// <returns>Regra interpretada.</returns>
        public static RRule Parse(string rrule)
        {
            // Ex: FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261231T235959Z
            var parts = rrule.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var p in parts)
            {
                var kv = p.Split('=', 2);
                if (kv.Length == 2) dict[kv[0]] = kv[1];
            }

            var freq = dict.TryGetValue("FREQ", out var f) ? f.ToUpperInvariant() : "DAILY";
            var interval = dict.TryGetValue("INTERVAL", out var i) && int.TryParse(i, out var iv) ? Math.Max(1, iv) : 1;

            HashSet<DayOfWeek>? byday = null;
            if (dict.TryGetValue("BYDAY", out var bd))
            {
                byday = bd.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(ParseDay)
                    .Where(d => d.HasValue)
                    .Select(d => d!.Value)
                    .ToHashSet();
            }

            DateTime? until = null;
            if (dict.TryGetValue("UNTIL", out var u))
            {
                // formato UTC: yyyyMMddTHHmmssZ
                if (DateTime.TryParseExact(u, "yyyyMMdd'T'HHmmss'Z'",
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                        out var dt))
                    until = dt;
            }

            int? count = null;
            if (dict.TryGetValue("COUNT", out var c) && int.TryParse(c, out var cv))
                count = Math.Max(1, cv);

            return new RRule { Freq = freq, Interval = interval, ByDay = byday, UntilUtc = until, Count = count };
        }

        /// <summary>
        /// Converte um token <c>BYDAY</c> (ex.: <c>MO</c>) num <see cref="DayOfWeek"/>.
        /// </summary>
        /// <param name="token">Token do dia da semana.</param>
        /// <returns>Dia da semana, ou <see langword="null"/> se o token for desconhecido.</returns>
        private static DayOfWeek? ParseDay(string token) => token.ToUpperInvariant() switch
        {
            "MO" => DayOfWeek.Monday,
            "TU" => DayOfWeek.Tuesday,
            "WE" => DayOfWeek.Wednesday,
            "TH" => DayOfWeek.Thursday,
            "FR" => DayOfWeek.Friday,
            "SA" => DayOfWeek.Saturday,
            "SU" => DayOfWeek.Sunday,
            _ => null
        };
    }

    /// <summary>
    /// Itera os inícios (<c>StartUtc</c>) das ocorrências para uma regra de recorrência, respeitando limites.
    /// </summary>
    /// <param name="startUtc">Início do evento base (UTC).</param>
    /// <param name="rule">Regra de recorrência interpretada.</param>
    /// <param name="untilUtc">Data/hora limite (UTC) opcional.</param>
    /// <param name="count">Número máximo de ocorrências opcional.</param>
    /// <param name="hardToUtc">Limite rígido (UTC) do pedido, para evitar iteração infinita.</param>
    /// <returns>Sequência de instantes de início de ocorrência (UTC).</returns>
    private static IEnumerable<DateTime> IterateStarts(
        DateTime startUtc,
        RRule rule,
        DateTime? untilUtc,
        int? count,
        DateTime hardToUtc)
    {
        // hardToUtc = limite do request (para não iterar infinito)
        // untilUtc = limite de recorrência
        // count = limite de ocorrências
        var limit = untilUtc.HasValue ? Min(untilUtc.Value, hardToUtc) : hardToUtc;

        // DAILY
        if (rule.Freq == "DAILY")
        {
            var cur = startUtc;
            while (cur < limit.AddDays(1))
            {
                yield return cur;
                cur = cur.AddDays(rule.Interval);
            }
            yield break;
        }

        // WEEKLY
        if (rule.Freq == "WEEKLY")
        {
            var byday = rule.ByDay ?? new HashSet<DayOfWeek> { startUtc.DayOfWeek };

            // vamos iterar dia a dia mas saltando semanas por Interval
            var cur = startUtc.Date;
            // alinhar para o início da semana do start (segunda como base)
            var weekStart = cur.AddDays(-(int)(((int)cur.DayOfWeek + 6) % 7));

            while (weekStart < limit.AddDays(7))
            {
                foreach (var d in Enum.GetValues<DayOfWeek>())
                {
                    if (!byday.Contains(d)) continue;

                    // converter dayOfWeek para offset segunda=0
                    var offset = ((int)d + 6) % 7;
                    var candidateDate = weekStart.AddDays(offset);

                    // manter hora original
                    var candidate = candidateDate.Add(startUtc.TimeOfDay);

                    if (candidate >= startUtc && candidate < limit.AddDays(1))
                        yield return candidate;
                }

                weekStart = weekStart.AddDays(7 * rule.Interval);
            }

            yield break;
        }

        // MONTHLY (mesmo dia do mês do start)
        if (rule.Freq == "MONTHLY")
        {
            var cur = startUtc;
            while (cur < limit.AddMonths(1))
            {
                yield return cur;
                cur = cur.AddMonths(rule.Interval);
            }
            yield break;
        }

        // YEARLY
        if (rule.Freq == "YEARLY")
        {
            var cur = startUtc;
            while (cur < limit.AddYears(1))
            {
                yield return cur;
                cur = cur.AddYears(rule.Interval);
            }
            yield break;
        }

        // fallback: sem suporte -> devolve só o start
        yield return startUtc;
    }

    /// <summary>
    /// Devolve a menor de duas datas.
    /// </summary>
    /// <param name="a">Primeira data.</param>
    /// <param name="b">Segunda data.</param>
    /// <returns>A menor data.</returns>
    private static DateTime Min(DateTime a, DateTime b) => a <= b ? a : b;
}
