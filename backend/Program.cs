using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
// using backend.Data;
// using backend.Services;
// using System.Text;

var builder = WebApplication.CreateBuilder(args);

//add the services here
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

//add swagger //this dose not add neyething just adds swagger to the apps
builder.Services.AddSwaggerGen(c=>{
    c.SwaggerDoc("v1",new OpenApiInfo{Title ="Secure Document API",Version ="v1"});
    c.AddSecurityDefinition("Bearer",new OpenApiSecuirityScheme
    {
        Description ="Jwt Autorization Header USing Barrer scheme",
        nameof="Authorization",
        In=ParameterLocation.Header,
        Type=SecuritySchemeType.ApiKey,
        Scheme = "Bearer"

    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement{
        {
            new OpenApiSecurityScheme{
                Referenc = new OpenApiRefrence{
                    Type = referenceType.SequrityScheme,
                    Id ="bearer"
                }
            },
            Array.Empty<string>()
        }
    });


});

//needs to register the database so others can use it inject it into them 
// first needs to register it as"App db context"
//configer Ef core to run in memeory ne need to stor in a database 
//🧠 What is AppDbContext? Defines database tables as C# classes. 
// when the app is restared this data is removed

builder.Services.AppDbContext<AppDbContext>( options =>
       options.UseInMemoryDatabase("secureDocumentdb"));
       //lamdafuctions has a vaeriable named options and after => its called 
       // and added to use inmemerydatabse

//read the key for the appsetting 
var jwtKey = builder.Configuration["jwt:jwtKey"];








app.Run();