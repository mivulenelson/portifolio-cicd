variable "aws_region" {
  description = "AWS region for the state bucket"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used to name the bootstrap resources (keep it the same as in infra/)"
  type        = string
  default     = "portfolio-cicd"
}

variable "github_repo" {
  description = "GitHub repository allowed to deploy, in the form OWNER/REPO"
  type        = string
}

variable "create_oidc_provider" {
  description = "Set to false if this AWS account already has the GitHub OIDC provider"
  type        = bool
  default     = true
}
