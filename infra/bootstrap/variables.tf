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

variable "github_owner_id" {
  description = "Numeric GitHub ID of the repository owner (gh api users/OWNER --jq .id)"
  type        = string
}

variable "github_repo_id" {
  description = "Numeric GitHub ID of the repository (gh api repos/OWNER/REPO --jq .id)"
  type        = string
}

variable "create_oidc_provider" {
  description = "Set to false if this AWS account already has the GitHub OIDC provider"
  type        = bool
  default     = true
}
