var app = WebApplication.CreateBuilder(args).Build();
var customers = CustomerSeed.Create();

app.MapGet("/api/customers", (string? search, string? status, string? sort, string? page, string? pageSize) =>
{
    if (status is not (null or "active" or "inactive"))
    {
        return Results.BadRequest(new { error = "Status must be active or inactive." });
    }

    if (sort is not (null or "id" or "name"))
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

    if (status is not null)
    {
        matches = matches.Where(customer => customer.Status == status);
    }

    var effectivePageSize = int.TryParse(pageSize, out var parsedPageSize) &&
        parsedPageSize is 10 or 25 or 50 or 100
        ? parsedPageSize
        : 25;
    var requestedPage = int.TryParse(page, out var parsedPage) && parsedPage > 0 ? parsedPage : 1;

    var ordered = sort == "name"
        ? matches
            .OrderBy(customer => customer.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(customer => customer.Id)
        : matches.OrderBy(customer => customer.Id);

    var totalItems = ordered.Count();
    var totalPages = (int)Math.Ceiling(totalItems / (double)effectivePageSize);
    var effectivePage = totalPages == 0 ? 1 : Math.Min(requestedPage, totalPages);
    var items = totalPages == 0
        ? []
        : ordered
            .Skip((effectivePage - 1) * effectivePageSize)
            .Take(effectivePageSize)
            .ToArray();

    return Results.Ok(new
    {
        items,
        page = effectivePage,
        pageSize = effectivePageSize,
        totalItems,
        totalPages
    });
});

app.Run();
