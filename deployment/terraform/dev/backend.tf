terraform {
  backend "gcs" {
    bucket = "qwiklabs-gcp-03-600de960a0a5-terraform-state"
    prefix = "agentic-era-hack/dev"
  }
}
