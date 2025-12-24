using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using  backend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace backend.Controllers{

// add the controler and base url
[ApiController]
[Route("api/[Controller]")] //n base url isn api/auth

public class AuthController:ControllerBase{
    private readonly AppDbContext _context;
    private readonly IConfigiration _configaration;

    public AuthController( AppDbContext context , IConfiguration configuration){
        _configaration = configuration;
        _Context = context ;
    }

    // create a user object 
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegsiterRequest request){
        //chack  if user exists
        if( await _context.Users.AnyAsync(u => u.username == request.Username))
        return badRequest(new {massage = "Username alrady exists"});

        if (await _context.Users.AnyAsync( u => u.Email == request.Email))
        return BadRequest(new {message = " Emaill alredy Exists "});

        //mage the object
        var user = new user {
            Username = request.username,
            Email = request.Email,
            PasswordHash = HashPassword(request.password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // genarate the jwt token to pass around 
        var token = GanarateJwtToken(user);

        // now retn the ok and massage 
        return ok (new {
            token,
            username = user.Username,
            email = user.Email
        });

    }

    // now the login 

}

}

