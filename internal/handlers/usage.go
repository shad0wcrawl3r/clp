package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// UpsertUsageRequest is the request body for upserting daily usage metrics.
type UpsertUsageRequest struct {
	UsageDate       string `json:"usage_date"        example:"2026-03-07"`
	EndpointsActive int32  `json:"endpoints_active"  example:"150"`
	EventsIngested  int64  `json:"events_ingested"   example:"1500000"`
	EpsAvg          int32  `json:"eps_avg"           example:"1736"`
	EpsPeak         int32  `json:"eps_peak"          example:"4200"`
}

// UpsertUsageMetrics godoc
// @Summary     Upsert daily usage metrics for a tenant
// @Description Creates or updates usage metrics for the given tenant and date (idempotent).
// @Tags        usage
// @Accept      json
// @Param       id   path string             true "Tenant UUID"
// @Param       body body UpsertUsageRequest true "Usage metrics"
// @Success     204  "No Content"
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/usage [put]
func UpsertUsageMetrics(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	var req UpsertUsageRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	date, err := parseDate(req.UsageDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().UpsertUsageMetricsDaily(context.Background(), database.UpsertUsageMetricsDailyParams{
		TenantID:        tenantID,
		UsageDate:       date,
		EndpointsActive: req.EndpointsActive,
		EventsIngested:  req.EventsIngested,
		EpsAvg:          req.EpsAvg,
		EpsPeak:         req.EpsPeak,
	}); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// GetUsageForDate godoc
// @Summary     Get usage metrics for a specific date
// @Description Returns usage metrics for the given tenant on the specified date (YYYY-MM-DD).
// @Tags        usage
// @Produce     json
// @Param       id   path     string true "Tenant UUID"
// @Param       date path     string true "Date (YYYY-MM-DD)"
// @Success     200  {object} database.UsageMetricsDaily
// @Failure     400  {object} ErrorResponse
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/usage/{date} [get]
func GetUsageForDate(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	date, err := parseDate(c.Params("date"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	record, err := state.AppState.DB().GetUsageForDate(context.Background(), database.GetUsageForDateParams{
		TenantID:  tenantID,
		UsageDate: date,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(record)
}

// GetUsageRange godoc
// @Summary     Get usage metrics for a date range
// @Description Returns daily usage metrics for the given tenant between from and to dates (inclusive), newest first.
// @Tags        usage
// @Produce     json
// @Param       id   path     string true  "Tenant UUID"
// @Param       from query    string true  "Start date (YYYY-MM-DD)"
// @Param       to   query    string true  "End date (YYYY-MM-DD)"
// @Success     200  {array}  database.UsageMetricsDaily
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /tenants/{id}/usage [get]
func GetUsageRange(c fiber.Ctx) error {
	tenantID, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	from, err := parseDate(c.Query("from"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "from: " + err.Error()})
	}
	to, err := parseDate(c.Query("to"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: "to: " + err.Error()})
	}
	records, err := state.AppState.DB().GetUsageRange(context.Background(), database.GetUsageRangeParams{
		TenantID:    tenantID,
		UsageDate:   from,
		UsageDate_2: to,
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(records)
}
