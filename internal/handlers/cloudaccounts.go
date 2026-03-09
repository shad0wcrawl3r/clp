package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// AddTenantCloudAccountRequest is the request body for adding a cloud account mapping.
type AddTenantCloudAccountRequest struct {
	CloudProvider  string `json:"cloud_provider"   example:"aws"`
	CloudAccountID string `json:"cloud_account_id" example:"123456789012"`
}

// ListTenantCloudAccounts godoc
// @Summary     List cloud account mappings for a tenant
// @Description Returns all cloud provider account associations for the given tenant.
// @Tags        cloud-accounts
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {array}  database.TenantCloudAccount
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/cloud-accounts [get]
func ListTenantCloudAccounts(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	accounts, err := state.AppState.DB().ListTenantCloudAccounts(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(accounts)
}

// AddTenantCloudAccount godoc
// @Summary     Add a cloud account mapping for a tenant
// @Description Associates a cloud provider account ID with the given tenant.
// @Tags        cloud-accounts
// @Accept      json
// @Produce     json
// @Param       id   path     string                        true "Tenant UUID"
// @Param       body body     AddTenantCloudAccountRequest  true "Cloud account"
// @Success     201  {object} database.TenantCloudAccount
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/cloud-accounts [post]
func AddTenantCloudAccount(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req AddTenantCloudAccountRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	account, err := state.AppState.DB().AddTenantCloudAccount(context.Background(), database.AddTenantCloudAccountParams{
		TenantID:       tenantID,
		CloudProvider:  database.DeploymentType(req.CloudProvider),
		CloudAccountID: req.CloudAccountID,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(account)
}

// DeleteTenantCloudAccount godoc
// @Summary     Delete a cloud account mapping
// @Description Removes a cloud provider account association by its UUID.
// @Tags        cloud-accounts
// @Param       id  path string true "Cloud account UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /cloud-accounts/{id} [delete]
func DeleteTenantCloudAccount(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().DeleteTenantCloudAccount(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}
