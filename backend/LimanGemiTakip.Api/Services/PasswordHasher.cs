using System.Security.Cryptography;

namespace LimanGemiTakip.Api.Services;

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 600000;
    private const int LegacyIterations = 10000;

    public static string HashPassword(string password)
    {
        using var algorithm = new Rfc2898DeriveBytes(password, SaltSize, Iterations, HashAlgorithmName.SHA256);
        var key = Convert.ToBase64String(algorithm.GetBytes(KeySize));
        var salt = Convert.ToBase64String(algorithm.Salt);
        return $"{salt}.{key}";
    }

    public static bool VerifyPassword(string password, string hash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash))
            return false;

        var parts = hash.Split('.', 2);
        if (parts.Length != 2) return false;

        try
        {
            var salt = Convert.FromBase64String(parts[0]);
            var keyBytes = Convert.FromBase64String(parts[1]);

            // Try with current 600,000 iterations
            using (var algorithm = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256))
            {
                var keyToCheck = algorithm.GetBytes(KeySize);
                if (CryptographicOperations.FixedTimeEquals(keyToCheck, keyBytes))
                    return true;
            }

            // Fallback: Try with legacy 10,000 iterations (for existing DB user hashes)
            using (var legacyAlgorithm = new Rfc2898DeriveBytes(password, salt, LegacyIterations, HashAlgorithmName.SHA256))
            {
                var keyToCheck = legacyAlgorithm.GetBytes(KeySize);
                if (CryptographicOperations.FixedTimeEquals(keyToCheck, keyBytes))
                    return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }
}
