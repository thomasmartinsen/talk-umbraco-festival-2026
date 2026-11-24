internal sealed record Customer(int Id, string Name, string Email, string Status);

internal static class CustomerSeed
{
    public static Customer[] Create()
    {
        string[] firstNames =
        [
            "Maya", "Theo", "Nora", "Elias", "Amira", "Leo", "Iris",
            "Mateo", "Zoe", "Oscar", "Lina", "Finn", "Ada", "Hugo"
        ];
        string[] lastNames =
        [
            "Chen", "Patel", "Andersen", "Rivera", "Kim",
            "Martin", "Okafor", "Ali", "Silva", "Park"
        ];

        return Enumerable.Range(0, 134).Select(index =>
        {
            var id = index + 1;
            var first = firstNames[index % firstNames.Length];
            var last = lastNames[index / firstNames.Length];
            var email = $"{first}.{last}.{id}@example.test".ToLowerInvariant();
            return new Customer(id, $"{first} {last}", email, id % 5 == 0 ? "inactive" : "active");
        }).ToArray();
    }
}
