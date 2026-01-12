using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StorageController : ControllerBase
{
    private readonly IStorageQuotaService _storageQuotaService;
    private readonly ILogger<StorageController> _logger;

    public StorageController(IStorageQuotaService storageQuotaService, ILogger<StorageController> logger)
    {
        _storageQuotaService = storageQuotaService;
        _logger = logger;
    }

    [HttpGet("quota")]
    public async Task<IActionResult> GetQuota()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        
        try
        {
            var quotaInfo = await _storageQuotaService.GetQuotaInfoAsync(userId);
            return Ok(quotaInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving quota for user {UserId}", userId);
            return StatusCode(500, "Error retrieving quota information");
        }
    }

    [HttpPut("quota")]
    [Authorize(Roles = "Admin")] // Only admins can update quotas
    public async Task<IActionResult> UpdateQuota([FromQuery] int userId, [FromQuery] long quotaBytes)
    {
        if (quotaBytes < 0)
            return BadRequest("Quota must be positive");

        var success = await _storageQuotaService.SetQuotaAsync(userId, quotaBytes);
        if (!success)
            return NotFound("User not found");

        return Ok(new { message = "Quota updated successfully" });
    }
}
