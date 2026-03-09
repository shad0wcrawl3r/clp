package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// CreateTenantRequest is the request body for creating a tenant.
type CreateTenantRequest struct {
	Name        string `json:"name"         example:"Acme Corp"`
	ExternalRef string `json:"external_ref" example:"ext-acme-123"`
	Status      string `json:"status"       example:"active"`
}

// UpdateTenantStatusRequest is the request body for updating tenant status.
type UpdateTenantStatusRequest struct {
	Status string `json:"status" example:"suspended"`
}

// ListTenants godoc
// @Summary     List tenants
// @Description Returns a paginated list of tenants ordered by creation time descending.
// @Tags        tenants
// @Produce     json
// @Param       limit  query    int  false  "Page size (default 20)"
// @Param       offset query    int  false  "Page offset (default 0)"
// @Success     200    {array}  database.Tenant
// @Failure     500    {object} ErrorResponse
// @Router      /tenants [get]
func ListTenants(c fiber.Ctx) error {
	limit := queryInt(c, "limit", 20)
	offset := queryInt(c, "offset", 0)
	tenants, err := state.AppState.DB().ListTenants(context.Background(), database.ListTenantsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(tenants)
}

// CreateTenant godoc
// @Summary     Create a tenant
// @Description Creates a new tenant. Status defaults to "active" if omitted.
// @Tags        tenants
// @Accept      json
// @Produce     json
// @Param       body body     CreateTenantRequest true "Tenant"
// @Success     201  {object} database.Tenant
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants [post]
func CreateTenant(c fiber.Ctx) error {
	var req CreateTenantRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	status := database.TenantStatus(req.Status)
	if status == "" {
		status = database.TenantStatusActive
	}
	tenant, err := state.AppState.DB().CreateTenant(context.Background(), database.CreateTenantParams{
		Name:        req.Name,
		ExternalRef: optText(req.ExternalRef),
		Status:      status,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(tenant)
}

// GetTenant godoc
// @Summary     Get a tenant
// @Description Returns a single tenant by UUID.
// @Tags        tenants
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {object} database.Tenant
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id} [get]
func GetTenant(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	tenant, err := state.AppState.DB().GetTenant(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(tenant)
}

// DeleteTenant godoc
// @Summary     Delete a tenant
// @Description Permanently deletes a tenant by UUID.
// @Tags        tenants
// @Param       id  path string true "Tenant UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /tenants/{id} [delete]
func DeleteTenant(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().DeleteTenant(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UpdateTenantStatus godoc
// @Summary     Update tenant status
// @Description Sets the tenant status (active, suspended, deleted).
// @Tags        tenants
// @Accept      json
// @Param       id   path string                    true "Tenant UUID"
// @Param       body body UpdateTenantStatusRequest true "Status"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/status [patch]
func UpdateTenantStatus(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req UpdateTenantStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpdateTenantStatus(context.Background(), database.UpdateTenantStatusParams{
		ID:     id,
		Status: database.TenantStatus(req.Status),
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// GetTenantByExternalRef godoc
// @Summary     Get tenant by external reference
// @Description Looks up a tenant using its external system reference identifier.
// @Tags        tenants
// @Produce     json
// @Param       ref  path     string true "External reference"
// @Success     200  {object} database.Tenant
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/external/{ref} [get]
func GetTenantByExternalRef(c fiber.Ctx) error {
	ref := c.Params("ref")
	tenant, err := state.AppState.DB().GetTenantByExternalRef(context.Background(), pgtype.Text{String: ref, Valid: true})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(tenant)
}
