package handlers

import (
	"context"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// CreateDeploymentRequest is the request body for creating a deployment.
type CreateDeploymentRequest struct {
	DeploymentType string `json:"deployment_type" example:"aws"`
	Region         string `json:"region"          example:"us-east-1"`
	Environment    string `json:"environment"     example:"production"`
}

// UpdateDeploymentStatusRequest is the request body for updating deployment status.
type UpdateDeploymentStatusRequest struct {
	Status string `json:"status" example:"suspended"`
}

// SubscribeRequest is the request body for the subscribe endpoint.
type SubscribeRequest struct {
	DeploymentKey string `json:"deployment_key" example:"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"`
}

// SubscribeResponse is returned by POST /subscribe and POST /subscribe/refresh.
type SubscribeResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TenantID     any    `json:"tenant_id"`
	DeploymentID any    `json:"deployment_id"`
}

// RefreshRequest is the request body for the token refresh endpoint.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// ListTenantDeployments godoc
// @Summary     List deployments for a tenant
// @Description Returns all deployments belonging to the given tenant, newest first.
// @Tags        deployments
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {array}  database.Deployment
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/deployments [get]
func ListTenantDeployments(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	deployments, err := state.AppState.DB().ListTenantDeployments(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(deployments)
}

// CreateDeployment godoc
// @Summary     Create a deployment for a tenant
// @Description Registers a new cloud deployment (aws, azure, gcp, onprem) for the given tenant. The response includes a deployment_key — provide this to your subscriber software.
// @Tags        deployments
// @Accept      json
// @Produce     json
// @Param       id   path     string                  true "Tenant UUID"
// @Param       body body     CreateDeploymentRequest true "Deployment"
// @Success     201  {object} database.Deployment
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/deployments [post]
func CreateDeployment(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req CreateDeploymentRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	deployment, err := state.AppState.DB().CreateDeployment(context.Background(), database.CreateDeploymentParams{
		TenantID:       tenantID,
		DeploymentType: database.DeploymentType(req.DeploymentType),
		Region:         optText(req.Region),
		Environment:    optText(req.Environment),
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(deployment)
}

// GetDeployment godoc
// @Summary     Get a deployment
// @Description Returns a deployment by UUID.
// @Tags        deployments
// @Produce     json
// @Param       id   path     string true "Deployment UUID"
// @Success     200  {object} database.Deployment
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /deployments/{id} [get]
func GetDeployment(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	deployment, err := state.AppState.DB().GetDeployment(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(deployment)
}

// ListAllDeployments godoc
// @Summary     List all deployments
// @Description Returns all deployments across all tenants, newest first. Supports ?limit and ?offset pagination.
// @Tags        deployments
// @Produce     json
// @Param       limit   query int false "Max results (default 50)"
// @Param       offset  query int false "Offset (default 0)"
// @Success     200  {array}  database.ListAllDeploymentsRow
// @Failure     500  {object} ErrorResponse
// @Router      /deployments [get]
func ListAllDeployments(c fiber.Ctx) error {
	limit := int32(50)
	offset := int32(0)
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = int32(n)
		}
	}
	if v := c.Query("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			offset = int32(n)
		}
	}
	rows, err := state.AppState.DB().ListAllDeployments(context.Background(), database.ListAllDeploymentsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(rows)
}

// UpdateDeploymentStatus godoc
// @Summary     Update deployment status
// @Description Sets the status of a deployment (active, suspended, revoked).
// @Tags        deployments
// @Accept      json
// @Param       id   path     string                        true "Deployment UUID"
// @Param       body body     UpdateDeploymentStatusRequest true "Status"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /deployments/{id}/status [patch]
func UpdateDeploymentStatus(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req UpdateDeploymentStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpdateDeploymentStatus(context.Background(), database.UpdateDeploymentStatusParams{
		ID:     id,
		Status: database.DeploymentStatus(req.Status),
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// DeleteDeployment godoc
// @Summary     Delete a deployment
// @Description Permanently removes a deployment by UUID.
// @Tags        deployments
// @Param       id  path string true "Deployment UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /deployments/{id} [delete]
func DeleteDeployment(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().DeleteDeployment(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Subscribe godoc
// @Summary     Subscribe with a deployment key
// @Description Exchange a deployment key for JWT access and refresh tokens. Called by subscriber software to bootstrap against CLP.
// @Tags        subscribe
// @Accept      json
// @Produce     json
// @Param       body body     SubscribeRequest  true "Deployment key"
// @Success     200  {object} SubscribeResponse
// @Failure     400  {object} ErrorResponse
// @Failure     403  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Router      /subscribe [post]
func Subscribe(c fiber.Ctx) error {
	var req SubscribeRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if req.DeploymentKey == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "deployment_key is required"})
	}
	row, err := state.AppState.DB().GetDeploymentByKey(context.Background(), req.DeploymentKey)
	if err != nil {
		return dbErr(c, err)
	}
	if row.Status != database.DeploymentStatusActive {
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: "deployment is not active"})
	}
	tenantID := uuidStr(row.TenantID)
	deploymentID := uuidStr(row.ID)
	access, refresh, err := mintTokenPair(tenantID, deploymentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "failed to issue tokens"})
	}
	return c.JSON(SubscribeResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		TenantID:     row.TenantID,
		DeploymentID: row.ID,
	})
}

// RefreshTokens godoc
// @Summary     Refresh JWT tokens
// @Description Exchange a valid refresh token for a new access + refresh token pair.
// @Tags        subscribe
// @Accept      json
// @Produce     json
// @Param       body body     RefreshRequest    true "Refresh token"
// @Success     200  {object} SubscribeResponse
// @Failure     400  {object} ErrorResponse
// @Failure     401  {object} ErrorResponse
// @Router      /subscribe/refresh [post]
func RefreshTokens(c fiber.Ctx) error {
	var req RefreshRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if req.RefreshToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "refresh_token is required"})
	}
	claims, err := parseRefreshToken(req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{Error: "invalid or expired refresh token"})
	}
	access, refresh, err := mintTokenPair(claims.TenantID, claims.DeploymentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "failed to issue tokens"})
	}
	return c.JSON(SubscribeResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		TenantID:     claims.TenantID,
		DeploymentID: claims.DeploymentID,
	})
}
