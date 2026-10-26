"""Utilidades compartidas por los jobs de Spark.

Corre DENTRO del contenedor `spark` (Python 3.11, Spark 3.5.0): solo pyspark + stdlib.
Lanzar con:

    docker compose exec spark spark-submit \
        --packages org.apache.hadoop:hadoop-aws:3.3.4 /home/jovyan/jobs/<job>.py
"""

import os

from pyspark.sql import SparkSession

BRONZE = "s3a://bronze"
SILVER = "s3a://silver"
GOLD = "s3a://gold"


def get_spark(app_name: str) -> SparkSession:
    """SparkSession configurada para leer/escribir en MinIO vía S3A."""
    return (
        SparkSession.builder.appName(app_name)
        .config("spark.hadoop.fs.s3a.endpoint", os.environ.get("MINIO_ENDPOINT", "http://minio:9000"))
        .config("spark.hadoop.fs.s3a.access.key", os.environ["AWS_ACCESS_KEY_ID"])
        .config("spark.hadoop.fs.s3a.secret.key", os.environ["AWS_SECRET_ACCESS_KEY"])
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        # Todo timestamp se maneja en UTC; la hora local se deriva explícitamente por país.
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
