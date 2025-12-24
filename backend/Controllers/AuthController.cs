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
        // u is NOT a variable stored anywhere its a lambda paramater 

        //make the object
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
    //public async Task<IActionResult> nameofthemethode
    //([FromBody] LoginRequest request) this takes the input and injects it to the methode
    // formbody - this reads json
    //LoginRequest is form the DTO

    // its in models folder
    //rewuest is the variable that holds the DTO/model

    public async Task<IActionResult> login([FromBody] loginRequest request){
        var user = await  _context.Users.FirstOrDefaultAsync(u => 
                                                            u.Username == request.username );
        //User types "1234" → request.Password
        //Server computes HashPassword(request.Password) → "03ac674216f3e15c761ee1a5e255f067953623c8"
        //Compare this hash with the stored hash in the database (user.PasswordHash)
        // if the mach good no bad 
        if(user == null || !VerifyPassword(request.Password , user.PasswordHash))
            return Unauthorized(new {message = "Invalid Credentials"});
        
        var token = GenerateJwtToken(user);

        return ok(new {
            token,
            username = user.Username,
            emaill - user.Email
        });
        // here if you use  username = request.Username,
        // this will only heck the suer input only not the database 

    }

    // make a JWT token for each uniqe USER

    private string GanarateJwtToken(User user ){

        //use the jwt key form the config and make a NEW KEY
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configaration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key,SymmetricAlgorithm.HmacSha256);

        var Claims = new []{
            new Claim(ClaimTypes.NameIdentifier ,user.Id.ToString()),
            new Claim(ClaimTypes.Name,   user.Username ),
            new Claim(ClaimTypes.Email,  user.Email    )
        };

        // now make the token 
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt: Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryInMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
        // convort the token to string 
    }

    // add the hashing 

    //add the veryfypassword 
}

}

