using System.Globalization;

var app = WebApplication.CreateBuilder(args).Build();
var customers = CustomerSeed.Create();

app.MapGet("/api/customers", (string? search, string? status, string? sort, string? page, string? pageSize) =>
{
    var normalizedStatus = status?.Trim();
    if (normalizedStatus is not null &&
        !string.Equals(normalizedStatus, "active", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(normalizedStatus, "inactive", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest(new { error = "Status must be active or inactive." });
    }

    var normalizedSort = sort?.Trim();
    if (normalizedSort is not null &&
        !string.Equals(normalizedSort, "id", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(normalizedSort, "name", StringComparison.OrdinalIgnoreCase))
    {
        return Results.BadRequest(new { error = "Sort must be id or name." });
    }

    IEnumerable<Customer> matches = customers;
    if (search?.Trim() is { Length: > 0 } term)
    {
        matches = matches.Where(customer =>
            customer.Name.Contains(term, StringComparison.OrdinalIgnoreCase) ||
            customer.Email.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    if (normalizedStatus is not null)
    {
        matches = matches.Where(customer =>
            string.Equals(customer.Status, normalizedStatus, StringComparison.OrdinalIgnoreCase));
    }

    var normalizedPageSize = 25;
    if (int.TryParse(
            pageSize?.Trim(),
            NumberStyles.None,
            CultureInfo.InvariantCulture,
            out var parsedPageSize) &&
        parsedPageSize is 10 or 25 or 50 or 100)
    {
        normalizedPageSize = parsedPageSize;
    }

    var normalizedPage = 1;
    if (int.TryParse(
            page?.Trim(),
            NumberStyles.None,
            CultureInfo.InvariantCulture,
            out var parsedPage) &&
        parsedPage > 0)
    {
        normalizedPage = parsedPage;
    }

    var matchingCustomers = matches as Customer[] ?? matches.ToArray();
    var totalItems = matchingCustomers.Length;
    var totalPages = totalItems == 0
        ? 0
        : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);

    if (totalPages == 0)
    {
        normalizedPage = 1;
    }
    else if (normalizedPage > totalPages)
    {
        normalizedPage = totalPages;
    }

    var ordered = CustomerQuery.Order(matchingCustomers, normalizedSort);
    var items = totalItems == 0
        ? Array.Empty<Customer>()
        : ordered
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToArray();

    return Results.Ok(new
    {
        items,
        page = normalizedPage,
        pageSize = normalizedPageSize,
        totalItems,
        totalPages
    });
});

app.Run();
