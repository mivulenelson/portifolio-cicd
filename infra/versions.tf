terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state: stored in S3 so the whole team and GitHub Actions share one state.
  # The bucket name and region are passed at init time:
  #   terraform init -backend-config="bucket=<STATE_BUCKET>" -backend-config="region=us-east-1"
  backend "s3" {
    key          = "portfolio/terraform.tfstate"
    encrypt      = true
    use_lockfile = true # S3-native state locking (Terraform 1.10+)
  }
}
