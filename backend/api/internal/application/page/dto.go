package page

type PublishPageRequest struct {
	Name       string `json:"name" binding:"required"`
	SchemaJSON string `json:"schemaJson" binding:"required"`
	HTML       string `json:"html" binding:"required"`
}

type PublishPageResponse struct {
	ID  uint64 `json:"id"`
	URL string `json:"url"`
}
