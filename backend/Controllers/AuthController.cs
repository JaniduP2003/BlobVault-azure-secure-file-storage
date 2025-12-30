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
[Route("api/[controller]")] //n base url isn api/auth

public class AuthController:ControllerBase{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController( AppDbContext context , IConfiguration configuration){
        _configuration = configuration;
        _context = context ;
    }

    // create a user object 
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request){
        //chack  if user exists
        if( await _context.Users.AnyAsync(u => u.Username == request.Username))
        return BadRequest(new {message = "Username already exists"});

        if (await _context.Users.AnyAsync( u => u.Email == request.Email))
        return BadRequest(new {message = "Email already Exists "});
        // u is NOT a variable stored anywhere its a lambda paramater 

        //make the object
        var user = new User {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // genarate the jwt token to pass around 
        var token = GenerateJwtToken(user);

        // now retn the ok and massage 
        return Ok (new {
            token,
            username = user.Username,
            email = user.Email
        });

    }

    // now the login 
    //public async Task<IActionResult> nameofthemethode
    //([FromBody] LoginRequest request) this takes the input and injects it to the methode
    // formbody - this reads json
    //LoginRequest is form the DTO

    // its in models folder
    //rewuest is the variable that holds the DTO/model
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request){
        var user = await  _context.Users.FirstOrDefaultAsync(u => 
                                                            u.Username == request.Username );
        //User types "1234" → request.Password
        //Server computes HashPassword(request.Password) → "03ac674216f3e15c761ee1a5e255f067953623c8"
        //Compare this hash with the stored hash in the database (user.PasswordHash)
        // if the mach good no bad 
        if(user == null || !VerifyPassword(request.Password , user.PasswordHash))
            return Unauthorized(new {message = "Invalid Credentials"});
        
        var token = GenerateJwtToken(user);

        return Ok(new {
            token,
            username = user.Username,
            email = user.Email
        });
        // here if you use  username = request.Username,
        // this will only heck the suer input only not the database 

    }

    // make a JWT token for each uniqe USER

    private string GenerateJwtToken(User user ){

        //use the jwt key form the config and make a NEW KEY
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key,SecurityAlgorithms.HmacSha256);

        var claims = new []{
            new Claim(ClaimTypes.NameIdentifier ,user.Id.ToString()),
            new Claim(ClaimTypes.Name,   user.Username ),
            new Claim(ClaimTypes.Email,  user.Email    )
        };

        // now make the token 
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryInMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
        // convort the token to string 
    }

    // add the hashing 
    // converts plain text to hash 
    private static string HashPassword(string password){
        using var sha256 = SHA256.Create(); // crtate a hash SHA object 
        // /Encoding.UTF8.GetBytes(password) → converts password string to bytes.
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        //Converts the binary hash to Base64 string (e.g., "AbCdEf123...").
        return Convert.ToBase64String(hashedBytes);
    }

    //add the veryfypassword 
    // chacks if the user enetrd password machers the hashed passwored
    private static bool VerifyPassword(string password, string hash){
        return HashPassword(password) == hash;
    }
}

}

