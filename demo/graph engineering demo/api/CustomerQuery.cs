internal static class CustomerQuery
{
    internal static IEnumerable<Customer> Order(
        IEnumerable<Customer> customers,
        string? sort)
    {
        if (string.Equals(sort?.Trim(), "name", StringComparison.OrdinalIgnoreCase))
        {
            return customers
                .OrderBy(customer => customer.Name, StringComparer.OrdinalIgnoreCase)
                .ThenBy(customer => customer.Id);
        }

        return customers.OrderBy(customer => customer.Id);
    }
}
