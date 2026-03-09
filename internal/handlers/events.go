package handlers

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// CreateEntitlementEventRequest is the request body for creating an entitlement event.
type CreateEntitlementEventRequest struct {
	TenantID       string         `json:"tenant_id"       example:"123e4567-e89b-12d3-a456-426614174000"`
	SubscriptionID string         `json:"subscription_id" example:"123e4567-e89b-12d3-a456-426614174001"`
	DeploymentID   string         `json:"deployment_id"   example:"123e4567-e89b-12d3-a456-426614174002"`
	EventType      string         `json:"event_type"      example:"feature_enabled"`
	Metadata       map[string]any `json:"metadata"`
}

// SearchEventsRequest is the request body for searching events by metadata.
type SearchEventsRequest struct {
	Metadata map[string]any `json:"metadata"`
	Limit    int32          `json:"limit" example:"50"`
}

// CreateEntitlementEvent godoc
// @Summary     Create an entitlement event
// @Description Records an entitlement lifecycle event with arbitrary metadata.
// @Tags        events
// @Accept      json
// @Produce     json
// @Param       body body     CreateEntitlementEventRequest true "Event"
// @Success     201  {object} database.EntitlementEvent
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /events [post]
func CreateEntitlementEvent(c fiber.Ctx) error {
	var req CreateEntitlementEventRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	tenantID, err := parseUUID(req.TenantID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "tenant_id: " + err.Error()})
	}
	subID, err := parseUUID(req.SubscriptionID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "subscription_id: " + err.Error()})
	}
	deplID, err := parseUUID(req.DeploymentID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "deployment_id: " + err.Error()})
	}
	meta, err := json.Marshal(req.Metadata)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "metadata: " + err.Error()})
	}
	event, err := state.AppState.DB().CreateEntitlementEvent(context.Background(), database.CreateEntitlementEventParams{
		TenantID:       tenantID,
		SubscriptionID: subID,
		DeploymentID:   deplID,
		EventType:      req.EventType,
		Metadata:       meta,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(event)
}

// ListTenantEvents godoc
// @Summary     List events for a tenant
// @Description Returns entitlement events for the given tenant, newest first, with pagination.
// @Tags        events
// @Produce     json
// @Param       id     path     string true  "Tenant UUID"
// @Param       limit  query    int    false "Page size (default 50)"
// @Param       offset query    int    false "Page offset (default 0)"
// @Success     200    {array}  database.EntitlementEvent
// @Failure     400    {object} ErrorResponse
// @Failure     500    {object} ErrorResponse
// @Router      /tenants/{id}/events [get]
func ListTenantEvents(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	limit := queryInt(c, "limit", 50)
	offset := queryInt(c, "offset", 0)
	events, err := state.AppState.DB().ListTenantEvents(context.Background(), database.ListTenantEventsParams{
		TenantID: tenantID,
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(events)
}

// ListEventsByType godoc
// @Summary     List events by type
// @Description Returns entitlement events filtered by event type, newest first.
// @Tags        events
// @Produce     json
// @Param       type  query    string true  "Event type"
// @Param       limit query    int    false "Max results (default 50)"
// @Success     200   {array}  database.EntitlementEvent
// @Failure     400   {object} ErrorResponse
// @Failure     500   {object} ErrorResponse
// @Router      /events [get]
func ListEventsByType(c fiber.Ctx) error {
	eventType := c.Query("type")
	if eventType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "query param 'type' is required"})
	}
	limit := queryInt(c, "limit", 50)
	events, err := state.AppState.DB().ListEventsByType(context.Background(), database.ListEventsByTypeParams{
		EventType: eventType,
		Limit:     limit,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(events)
}

// SearchEventsByMetadata godoc
// @Summary     Search events by metadata
// @Description Returns events whose metadata contains the provided JSON fragment (JSONB containment query).
// @Tags        events
// @Accept      json
// @Produce     json
// @Param       body body     SearchEventsRequest true "Search query"
// @Success     200  {array}  database.EntitlementEvent
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /events/search [post]
func SearchEventsByMetadata(c fiber.Ctx) error {
	var req SearchEventsRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	meta, err := json.Marshal(req.Metadata)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "metadata: " + err.Error()})
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}
	events, err := state.AppState.DB().SearchEventsByMetadata(context.Background(), database.SearchEventsByMetadataParams{
		Metadata: meta,
		Limit:    limit,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(events)
}
