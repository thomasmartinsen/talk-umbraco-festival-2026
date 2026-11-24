// Prepared acceptance check: no test packages required. The API agent supplies
// CustomerQuery.Order and the actual endpoint must call that same method.
var customers = new Customer[]
{
    new(9, "Maya Chen", "9@example.test", "active"),
    new(7, "Zoe Chen", "7@example.test", "active"),
    new(2, "maya chen", "2@example.test", "active"),
    new(4, "Ada Chen", "4@example.test", "inactive"),
    new(5, "MAYA CHEN", "5@example.test", "inactive")
};
Check("case-insensitive name sorting with ID tie-breaker", "name", [4, 2, 5, 9, 7]);
Check("explicit ID ordering", "id", [2, 4, 5, 7, 9]);
Check("default ID ordering", null, [2, 4, 5, 7, 9]);
Console.WriteLine("All 3 query checks passed.");

void Check(string description, string? sort, int[] expected)
{
    int[] actual = CustomerQuery.Order(customers, sort).Select(c => c.Id).ToArray();
    if (!actual.SequenceEqual(expected))
        throw new InvalidOperationException($"{description}: expected [{string.Join(",", expected)}], got [{string.Join(",", actual)}]");
    Console.WriteLine($"PASS: {description}");
}
