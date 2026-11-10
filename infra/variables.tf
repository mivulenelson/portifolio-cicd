variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used to name every resource"
  type        = string
  default     = "portfolio-cicd"
}

variable "environment" {
  description = "Environment label added to resource tags"
  type        = string
  default     = "production"
}

variable "image_tag" {
  description = "Docker image tag to deploy (the short git commit SHA in CI)"
  type        = string
  default     = "latest"
}

variable "admin_username" {
  description = "Username for the portfolio admin page"
  type        = string
  default     = "admin"
}

variable "admin_password" {
  description = "Password for the portfolio admin page (stored in AWS Secrets Manager)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.admin_password) >= 12
    error_message = "admin_password must be at least 12 characters long."
  }
}

variable "task_cpu" {
  description = "Fargate task CPU units (512 = 0.5 vCPU)"
  type        = number
  default     = 512
}

variable "task_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Number of copies of the task to run"
  type        = number
  default     = 1
}
