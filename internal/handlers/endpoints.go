package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// RegisterEndpointRequest is the request body for registering an endpoint/agent.
type RegisterEndpointRequest struct {
	DeploymentID string `json:"deployment_id"  example:"123e4567-e89b-12d3-a456-426614174000"`
	Hostname     string `json:"hostname"       example:"agent-prod-01.acme.com"`
	OS           string `json:"os"             example:"linux"`
	AgentVersion string `json:"agent_version"  example:"2.1.0"`
}

// UpdateEndpointStatusRequest is the request body for updating endpoint status.
type UpdateEndpointStatusRequest struct {
	Status string `json:"status" example:"inactive"`
}

// ActiveEndpointCountResponse is the response for counting active endpoints.
type ActiveEndpointCountResponse struct {
	Count int64 `json:"count" example:"42"`
}

// ListTenantEndpoints godoc
// @Summary     List endpoints for a tenant
// @Description Returns all endpoints/agents registered under the given tenant, newest first.
// @Tags        endpoints
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {array}  database.Endpoint
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/endpoints [get]
func ListTenantEndpoints(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	endpoints, err := state.AppState.DB().ListTenantEndpoints(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(endpoints)
}

// RegisterEndpoint godoc
// @Summary     Register an endpoint for a tenant
// @Description Registers a new agent/endpoint under the given tenant.
// @Tags        endpoints
// @Accept      json
// @Produce     json
// @Param       id   path     string                  true "Tenant UUID"
// @Param       body body     RegisterEndpointRequest true "Endpoint"
// @Success     201  {object} database.Endpoint
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/endpoints [post]
func RegisterEndpoint(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req RegisterEndpointRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	deploymentID, err := parseUUID(req.DeploymentID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	endpoint, err := state.AppState.DB().RegisterEndpoint(context.Background(), database.RegisterEndpointParams{
		TenantID:     tenantID,
		DeploymentID: deploymentID,
		Hostname:     optText(req.Hostname),
		Os:           optText(req.OS),
		AgentVersion: optText(req.AgentVersion),
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(endpoint)
}

// CountActiveEndpoints godoc
// @Summary     Count active endpoints for a tenant
// @Description Returns the number of endpoints with status "active" for the given tenant.
// @Tags        endpoints
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {object} ActiveEndpointCountResponse
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/endpoints/count [get]
func CountActiveEndpoints(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	count, err := state.AppState.DB().CountActiveEndpoints(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(ActiveEndpointCountResponse{Count: count})
}

// GetEndpoint godoc
// @Summary     Get an endpoint
// @Description Returns an endpoint/agent by UUID.
// @Tags        endpoints
// @Produce     json
// @Param       id   path     string true "Endpoint UUID"
// @Success     200  {object} database.Endpoint
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /endpoints/{id} [get]
func GetEndpoint(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	endpoint, err := state.AppState.DB().GetEndpoint(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(endpoint)
}

// EndpointHeartbeat godoc
// @Summary     Record endpoint heartbeat
// @Description Updates the last_seen timestamp for the endpoint to now.
// @Tags        endpoints
// @Param       id  path string true "Endpoint UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /endpoints/{id}/heartbeat [post]
func EndpointHeartbeat(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpdateEndpointHeartbeat(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UpdateEndpointStatus godoc
// @Summary     Update endpoint status
// @Description Sets the endpoint status (active, inactive, deleted).
// @Tags        endpoints
// @Accept      json
// @Param       id   path string                       true "Endpoint UUID"
// @Param       body body UpdateEndpointStatusRequest  true "Status"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /endpoints/{id}/status [patch]
func UpdateEndpointStatus(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req UpdateEndpointStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpdateEndpointStatus(context.Background(), database.UpdateEndpointStatusParams{
		ID:     id,
		Status: database.EndpointStatus(req.Status),
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// DeleteEndpoint godoc
// @Summary     Delete an endpoint
// @Description Permanently removes an endpoint/agent by UUID.
// @Tags        endpoints
// @Param       id  path string true "Endpoint UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /endpoints/{id} [delete]
func DeleteEndpoint(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().DeleteEndpoint(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}
