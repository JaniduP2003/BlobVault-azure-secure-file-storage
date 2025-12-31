# Backend Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore ./backend.csproj
COPY . ./
RUN dotnet publish ./backend.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV AzureStorage__ConnectionString=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFeqGh0pJ+0m+E0xKZb6Y9r5n9X5y6l9r9F1X1y0z2b9X0N4u6+g==;BlobEndpoint=http://azurite:10000/devstoreaccount1;
ENTRYPOINT ["dotnet", "backend.dll"]
