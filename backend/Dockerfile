# Backend Dockerfile - Optimized multi-stage build
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
WORKDIR /app
EXPOSE 8080

# Use non-root user for security
RUN addgroup -g 1001 dotnet && adduser -u 1001 -G dotnet -s /bin/sh -D dotnet

FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Copy csproj and restore dependencies (cached layer)
COPY *.csproj ./
RUN dotnet restore ./backend.csproj

# Copy source code and build
COPY . ./
RUN dotnet publish ./backend.csproj -c Release -o /app/publish \
    --no-restore \
    /p:PublishTrimmed=false

FROM base AS final
WORKDIR /app

# Create data directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown -R dotnet:dotnet /app/data

# Copy published files
COPY --from=build --chown=dotnet:dotnet /app/publish .

# Switch to non-root user
USER dotnet

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV AzureStorage__ConnectionString=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;

ENTRYPOINT ["dotnet", "backend.dll"]
