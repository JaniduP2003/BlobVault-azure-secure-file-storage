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
ENV AzureStorage__ConnectionString="UseDevelopmentStorage=true;BlobEndpoint=http://azurite:10000/devstoreaccount1;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFeqCnf2P==;"
ENTRYPOINT ["dotnet", "backend.dll"]
