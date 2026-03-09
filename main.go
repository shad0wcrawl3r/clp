// @title       CLP API
// @version     1.0
// @description Cloud License Platform — multi-tenant SaaS licensing and entitlement management.
// @host        localhost:3000
// @BasePath    /api

package main

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/rs/zerolog/log"
	_ "github.com/shadowcrawler/clp/docs"
	"github.com/shadowcrawler/clp/internal/routes"
	"github.com/shadowcrawler/clp/internal/state"
	"github.com/shadowcrawler/clp/internal/utils"
)

func init() {
	utils.SetupLogging()
}

func main() {
	state.NewState()
	app := fiber.New(fiber.Config{
		// Don't expose Fiber version in Server header
		ServerHeader: "clp",
	})
	routes.RegisterRoutes(app)

	// Serve built frontend assets (production)
	app.Use("/", static.New("./frontend/dist"))

	// SPA fallback: non-/api paths serve index.html for client-side routing
	app.Use(func(c fiber.Ctx) error {
		if strings.HasPrefix(c.Path(), "/api") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
		}
		return c.SendFile("./frontend/dist/index.html")
	})
	if err := app.Listen("0.0.0.0:3000"); err != nil {
		log.Fatal().Err(err).Msg("Failed to start server")
	}
}
