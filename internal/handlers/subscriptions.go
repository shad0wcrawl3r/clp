package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// CreateSubscriptionRequest is the request body for creating a subscription.
type CreateSubscriptionRequest struct {
	PlanCode     string `json:"plan_code"     example:"enterprise"`
	BillingModel string `json:"billing_model" example:"prepaid"`
	Status       string `json:"status"        example:"trial"`
	StartDate    string `json:"start_date"    example:"2026-01-01"`
	EndDate      string `json:"end_date"      example:"2027-01-01"`
	TrialEnd     string `json:"trial_end"     example:"2026-02-01"`
	AutoRenew    bool   `json:"auto_renew"    example:"true"`
}

// UpdateSubscriptionStatusRequest is the request body for updating subscription status.
type UpdateSubscriptionStatusRequest struct {
	Status string `json:"status" example:"active"`
}

// AddSubscriptionFeatureRequest is the request body for adding a feature to a subscription.
type AddSubscriptionFeatureRequest struct {
	FeatureID string          `json:"feature_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Enabled   bool            `json:"enabled"    example:"true"`
	Limits    map[string]any  `json:"limits"`
}

// ListTenantSubscriptions godoc
// @Summary     List subscriptions for a tenant
// @Description Returns all subscriptions for the given tenant, newest first.
// @Tags        subscriptions
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {array}  database.Subscription
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/subscriptions [get]
func ListTenantSubscriptions(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	subs, err := state.AppState.DB().ListTenantSubscriptions(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(subs)
}

// CreateSubscription godoc
// @Summary     Create a subscription for a tenant
// @Description Creates a new subscription for the given tenant.
// @Tags        subscriptions
// @Accept      json
// @Produce     json
// @Param       id   path     string                    true "Tenant UUID"
// @Param       body body     CreateSubscriptionRequest true "Subscription"
// @Success     201  {object} database.Subscription
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/subscriptions [post]
func CreateSubscription(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req CreateSubscriptionRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	startDate, err := parseDate(req.StartDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	endDate, err := parseDate(req.EndDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var trialEnd = endDate // default: same as end if not provided
	if req.TrialEnd != "" {
		trialEnd, err = parseDate(req.TrialEnd)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
		}
	}
	sub, err := state.AppState.DB().CreateSubscription(context.Background(), database.CreateSubscriptionParams{
		TenantID:     tenantID,
		PlanCode:     req.PlanCode,
		BillingModel: database.BillingModel(req.BillingModel),
		Status:       database.SubscriptionStatus(req.Status),
		StartDate:    startDate,
		EndDate:      endDate,
		TrialEnd:     trialEnd,
		AutoRenew:    pgBool(req.AutoRenew),
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(sub)
}

// GetTenantActiveSubscription godoc
// @Summary     Get active subscription for a tenant
// @Description Returns the most recent subscription in trial, active, or grace status.
// @Tags        subscriptions
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Success     200  {object} database.Subscription
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/subscriptions/active [get]
func GetTenantActiveSubscription(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	sub, err := state.AppState.DB().GetTenantActiveSubscription(context.Background(), tenantID)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(sub)
}

// GetSubscription godoc
// @Summary     Get a subscription
// @Description Returns a subscription by UUID.
// @Tags        subscriptions
// @Produce     json
// @Param       id   path     string true "Subscription UUID"
// @Success     200  {object} database.Subscription
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /subscriptions/{id} [get]
func GetSubscription(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	sub, err := state.AppState.DB().GetSubscription(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(sub)
}

// UpdateSubscriptionStatus godoc
// @Summary     Update subscription status
// @Description Sets the subscription status (trial, active, grace, past_due, cancelled, expired).
// @Tags        subscriptions
// @Accept      json
// @Param       id   path string                           true "Subscription UUID"
// @Param       body body UpdateSubscriptionStatusRequest  true "Status"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /subscriptions/{id}/status [patch]
func UpdateSubscriptionStatus(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req UpdateSubscriptionStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpdateSubscriptionStatus(context.Background(), database.UpdateSubscriptionStatusParams{
		ID:     id,
		Status: database.SubscriptionStatus(req.Status),
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// CancelSubscription godoc
// @Summary     Cancel a subscription
// @Description Sets the subscription status to cancelled.
// @Tags        subscriptions
// @Param       id  path string true "Subscription UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /subscriptions/{id}/cancel [post]
func CancelSubscription(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().CancelSubscription(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ListSubscriptionFeatures godoc
// @Summary     List features for a subscription
// @Description Returns the features and their enabled/limit state for the given subscription.
// @Tags        subscriptions
// @Produce     json
// @Param       id   path     string true "Subscription UUID"
// @Success     200  {array}  database.ListSubscriptionFeaturesRow
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /subscriptions/{id}/features [get]
func ListSubscriptionFeatures(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	features, err := state.AppState.DB().ListSubscriptionFeatures(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(features)
}

// AddSubscriptionFeature godoc
// @Summary     Add or update a feature on a subscription
// @Description Upserts a feature entitlement for the given subscription (idempotent).
// @Tags        subscriptions
// @Accept      json
// @Param       id   path string                       true "Subscription UUID"
// @Param       body body AddSubscriptionFeatureRequest true "Feature entitlement"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /subscriptions/{id}/features [post]
func AddSubscriptionFeature(c fiber.Ctx) error {
	subID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req AddSubscriptionFeatureRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	featureID, err := parseUUID(req.FeatureID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	limits, _ := marshalJSON(req.Limits)
	if err := state.AppState.DB().AddSubscriptionFeature(context.Background(), database.AddSubscriptionFeatureParams{
		SubscriptionID: subID,
		FeatureID:      featureID,
		Enabled:        req.Enabled,
		Limits:         limits,
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// RemoveSubscriptionFeature godoc
// @Summary     Remove a feature from a subscription
// @Description Removes the feature entitlement for the given feature ID from the subscription.
// @Tags        subscriptions
// @Param       id        path string true "Subscription UUID"
// @Param       featureId path string true "Feature UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /subscriptions/{id}/features/{featureId} [delete]
func RemoveSubscriptionFeature(c fiber.Ctx) error {
	subID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	featureID, err := parseUUID(c.Params("featureId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().RemoveSubscriptionFeature(context.Background(), database.RemoveSubscriptionFeatureParams{
		SubscriptionID: subID,
		FeatureID:      featureID,
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ListSubscriptionEvents godoc
// @Summary     List events for a subscription
// @Description Returns all entitlement events for the given subscription, newest first.
// @Tags        subscriptions
// @Produce     json
// @Param       id   path     string true "Subscription UUID"
// @Success     200  {array}  database.EntitlementEvent
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /subscriptions/{id}/events [get]
func ListSubscriptionEvents(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	events, err := state.AppState.DB().ListSubscriptionEvents(context.Background(), id)
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(events)
}
