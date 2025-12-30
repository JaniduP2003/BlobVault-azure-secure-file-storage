using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using backend.Data;
using backend.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//add the services here
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

//add swagger //this dose not add neyething just adds swagger to the apps
// builder.Services.AddSwaggerGen(c=>{
//     c.SwaggerDoc("v1",new OpenApiInfo{Title ="Secure Document API",Version ="v1"});
//     c.AddSecurityDefinition("Bearer",new OpenApiSecurityScheme
//     {
//         Description ="Jwt Authorization Header Using Bearer scheme",
//         Name="Authorization",
//         In=ParameterLocation.Header,
//         Type=SecuritySchemeType.ApiKey,
//         Scheme = "Bearer"

//     });
//     c.AddSecurityRequirement(new OpenApiSecurityRequirement{
//         {
//             new OpenApiSecurityScheme{
//                 Reference = new OpenApiReference{
//                     Type = ReferenceType.SecurityScheme,
//                     Id ="Bearer"
//                 }
//             },
//             Array.Empty<string>()
//         }
//     });


// });

//needs to register the database so others can use it inject it into them 
// first needs to register it as"App db context"
//configer Ef core to run in memeory ne need to stor in a database 
//🧠 What is AppDbContext? Defines database tables as C# classes. 
// when the app is restared this data is removed

builder.Services.AddDbContext<AppDbContext>( options =>
       options.UseInMemoryDatabase("secureDocumentdb"));
       //lamdafuctions has a vaeriable named options and after => its called 
       // and added to use inmemerydatabse

//read the key for the appsetting 
var jwtKey = builder.Configuration["jwt:jwtKey"];
//add the jwt  barrer token schema
//jwt has a validation chackes i need to add this 
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer( options =>{
            options.TokenValidationParameters = new TokenValidationParameters{
                ValidateIssuer = true,
                ValidateAudience =true,
                ValidateLifetime =true,
                ValidateIssuerSigningKey =true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
            };

        });

//add cores so forntend can talk
//What it is: Registers CORS services in ASP.NET Core
builder.Services.AddCors(options =>{
    options.AddPolicy("AllowFrontend",policy =>{
        policy.WithOrigins("http://localhost:3000", "http://localhost:3000")
        .AllowAnyMethod() //allow CRUD post get
        .AllowAnyHeader() //allow http heder
        .AllowCredentials(); //allow cockies
    });

    });

//register the services here using a interface + implemenetation 
builder.Services.AddSingleton<IBlobService, BlobService>();
// add a cleen up 
builder.Services.AddHostedService<CleanupService>();

var app = builder.Build();

//add the http pipe line 
//only use swagger in if its dev eneviorment
if(app.Environment.IsDevelopment()){
    // app.UseSwagger();
    // app.UseSwaggerUI();
}

//must need a way to covert HTTP to HTTPS for security
app.UseHttpsRedirection();
//activate the allowforntend policy i made above
app.UseCors("AllowFrontend");
//both middleware to auth and authxication
app.UseAuthentication();
app.UseAuthorization();
//register all the end points 
app.MapControllers();








app.Run();