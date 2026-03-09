package routes

import (
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/handlers"
)

func RegisterRoutes(app *fiber.App) {
	// Swagger UI — Fiber v3 natively adapts net/http handlers
	// Accessible at /api/docs/index.html and /api/docs/doc.json
	app.Get("/api/docs", func(c fiber.Ctx) error {
		return c.Redirect().To("/api/docs/index.html")
	})
	app.Get("/api/docs/*", httpSwagger.WrapHandler)

	api := app.Group("/api")

	// Tenants
	tenants := api.Group("/tenants")
	tenants.Get("/", handlers.ListTenants)
	tenants.Post("/", handlers.CreateTenant)
	tenants.Get("/external/:ref", handlers.GetTenantByExternalRef)
	tenants.Get("/:id", handlers.GetTenant)
	tenants.Delete("/:id", handlers.DeleteTenant)
	tenants.Patch("/:id/status", handlers.UpdateTenantStatus)

	// Tenant → Subscriptions
	tenants.Get("/:id/subscriptions", handlers.ListTenantSubscriptions)
	tenants.Post("/:id/subscriptions", handlers.CreateSubscription)
	tenants.Get("/:id/subscriptions/active", handlers.GetTenantActiveSubscription)

	// Tenant → Cloud Accounts
	tenants.Get("/:id/cloud-accounts", handlers.ListTenantCloudAccounts)
	tenants.Post("/:id/cloud-accounts", handlers.AddTenantCloudAccount)

	// Tenant → Deployments
	tenants.Get("/:id/deployments", handlers.ListTenantDeployments)
	tenants.Post("/:id/deployments", handlers.CreateDeployment)

	// Tenant → Endpoints
	tenants.Get("/:id/endpoints", handlers.ListTenantEndpoints)
	tenants.Post("/:id/endpoints", handlers.RegisterEndpoint)
	tenants.Get("/:id/endpoints/count", handlers.CountActiveEndpoints)

	// Tenant → Events
	tenants.Get("/:id/events", handlers.ListTenantEvents)

	// Tenant → Usage
	tenants.Put("/:id/usage", handlers.UpsertUsageMetrics)
	tenants.Get("/:id/usage/:date", handlers.GetUsageForDate)
	tenants.Get("/:id/usage", handlers.GetUsageRange)

	// Subscriptions
	subs := api.Group("/subscriptions")
	subs.Get("/:id", handlers.GetSubscription)
	subs.Patch("/:id/status", handlers.UpdateSubscriptionStatus)
	subs.Post("/:id/cancel", handlers.CancelSubscription)
	subs.Get("/:id/features", handlers.ListSubscriptionFeatures)
	subs.Post("/:id/features", handlers.AddSubscriptionFeature)
	subs.Delete("/:id/features/:featureId", handlers.RemoveSubscriptionFeature)
	subs.Get("/:id/events", handlers.ListSubscriptionEvents)

	// Features
	features := api.Group("/features")
	features.Get("/", handlers.ListFeatures)
	features.Post("/", handlers.CreateFeature)
	features.Get("/:code", handlers.GetFeatureByCode)
	features.Delete("/:id", handlers.DeleteFeature)

	// Deployments — global list must be before the /:id group
	api.Get("/deployments", handlers.ListAllDeployments)
	deployments := api.Group("/deployments")
	deployments.Get("/:id", handlers.GetDeployment)
	deployments.Patch("/:id/status", handlers.UpdateDeploymentStatus)
	deployments.Delete("/:id", handlers.DeleteDeployment)

	// Subscribe — called by subscriber software with a deployment key
	api.Post("/subscribe", handlers.Subscribe)
	api.Post("/subscribe/refresh", handlers.RefreshTokens)

	// Cloud Accounts
	api.Delete("/cloud-accounts/:id", handlers.DeleteTenantCloudAccount)

	// Endpoints
	endpoints := api.Group("/endpoints")
	endpoints.Get("/:id", handlers.GetEndpoint)
	endpoints.Post("/:id/heartbeat", handlers.EndpointHeartbeat)
	endpoints.Patch("/:id/status", handlers.UpdateEndpointStatus)
	endpoints.Delete("/:id", handlers.DeleteEndpoint)

	// Events
	api.Post("/events", handlers.CreateEntitlementEvent)
	api.Get("/events", handlers.ListEventsByType)
	api.Post("/events/search", handlers.SearchEventsByMetadata)

	// Admin
	api.Post("/admin/subscriptions/expire", handlers.ExpireSubscriptions)
}
