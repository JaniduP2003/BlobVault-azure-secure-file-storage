using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using backend.Data;
using backend.Services;
using System.Text;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to allow large file uploads (100MB max)
builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

// Configure IIS to allow large file uploads (if hosting on IIS)
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

// Configure form options to allow large multipart form data
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100MB
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

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
//Configure EF Core to use SQLite for persistent storage
//🧠 What is AppDbContext? Defines database tables as C# classes. 
// SQLite database persists data even when the app is restarted

builder.Services.AddDbContext<AppDbContext>(options =>
       options.UseSqlite("Data Source=/app/data/securedocuments.db"));
// Creates a SQLite database file in the mounted volume that persists between restarts

// read the key for the appsetting (try standard 'Jwt:Key' first, then legacy 'jwt:jwtKey')
var cfgKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["jwt:jwtKey"];
var fallbackKey = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // 64 bytes
var jwtKeyString = cfgKey ?? fallbackKey;
if (System.Text.Encoding.UTF8.GetBytes(jwtKeyString).Length < 64)
{
    jwtKeyString = fallbackKey;
}
// Derive a 512-bit key by hashing the configured key with SHA-512 so it matches HS512-sized signing keys
var jwtKeyBytes = System.Security.Cryptography.SHA512.HashData(System.Text.Encoding.UTF8.GetBytes(jwtKeyString));
//add the jwt  barrer token schema
//jwt has a validation chackes i need to add this 
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytes)
            };

            // Allow token from query string for file downloads (since browser window.open can't set headers)
            options.Events = new JwtBearerEvents
            //JWT middleware lets you intercept parts of the authentication process.
            {
                OnMessageReceived = context =>
                {
                    // Check if token is in query string (for download/preview links)
                    if (context.Request.Query.ContainsKey("token"))
                    {
                        context.Token = context.Request.Query["token"];
                        //Tell JWT middleware “this is the token”
                    }
                    return Task.CompletedTask;
                }
            };

        });

//add cores so forntend can talk
//What it is: Registers CORS services in ASP.NET Core
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
        .AllowAnyMethod() //allow CRUD post get
        .AllowAnyHeader() //allow http heder
        .AllowCredentials() //allow cockies
        .WithExposedHeaders("Content-Disposition") // Expose additional headers if needed
        .SetPreflightMaxAge(TimeSpan.FromMinutes(10)); // Cache preflight requests for 10 minutes
    });

});

//register the services here using a interface + implemenetation 
builder.Services.AddSingleton<IBlobService, BlobService>();
// add a cleen up 
builder.Services.AddHostedService<CleanupService>();
// add storage quota service
builder.Services.AddScoped<IStorageQuotaService, StorageQuotaService>();

// If a background service throws, don't stop the whole host during development.
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

var app = builder.Build();

// Ensure database is created on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated(); // Creates the database if it doesn't exist
}

//add the http pipe line 
//only use swagger in if its dev eneviorment
if (app.Environment.IsDevelopment())
{
    // app.UseSwagger();
    // app.UseSwaggerUI();
}

//must need a way to covert HTTP to HTTPS for security
// Commented out for development to avoid HTTPS redirect issues with CORS
// app.UseHttpsRedirection();
//activate the allowforntend policy i made above
app.UseCors("AllowFrontend");
//both middleware to auth and authxication
app.UseAuthentication();
app.UseAuthorization();
//register all the end points 
app.MapControllers();








app.Run();