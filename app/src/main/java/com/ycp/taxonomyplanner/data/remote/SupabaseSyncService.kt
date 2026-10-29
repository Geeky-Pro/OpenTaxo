package com.ycp.taxonomyplanner.data.remote

import com.ycp.taxonomyplanner.BuildConfig
import com.ycp.taxonomyplanner.data.local.AttributeEntity
import com.ycp.taxonomyplanner.data.local.TaxonomyNodeEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class SupabaseSyncSummary(
    val pulledNodes: Int,
    val pulledAttributes: Int,
    val pushedNodes: Int,
    val messageAr: String
)

class SupabaseSyncService {

    private val json = Json { ignoreUnknownKeys = true }

    val supabaseUrl: String
        get() = BuildConfig.NEXT_PUBLIC_SUPABASE_URL.trim().trimEnd('/')

    val supabasePublishableKey: String
        get() = BuildConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim()

    val isConfigured: Boolean
        get() = supabaseUrl.startsWith("http") && supabasePublishableKey.isNotEmpty()

    @Volatile
    var accessToken: String? = null
        private set

    @Volatile
    var signedInEmail: String? = null
        private set

    fun signOut() {
        accessToken = null
        signedInEmail = null
    }

    suspend fun signInOwner(email: String, password: String): Result<String> =
        withContext(Dispatchers.IO) {
            if (!isConfigured) {
                return@withContext Result.failure(
                    IllegalStateException("لم يتم ضبط NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY في لوحة الأسرار (Secrets).")
                )
            }
            runCatching {
                val endpoint = URL("$supabaseUrl/auth/v1/token?grant_type=password")
                val conn = (endpoint.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 8000
                    readTimeout = 8000
                    doOutput = true
                    setRequestProperty("apikey", supabasePublishableKey)
                    setRequestProperty("Content-Type", "application/json")
                }
                val payload = buildJsonObject {
                    put("email", JsonPrimitive(email.trim()))
                    put("password", JsonPrimitive(password))
                }.toString()
                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload) }

                val code = conn.responseCode
                val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.use { it.readText() }.orEmpty()
                if (code !in 200..299) {
                    throw IllegalStateException("فشل تسجيل الدخول في Supabase (رمز $code).")
                }
                val obj = json.parseToJsonElement(body).jsonObject
                val token = obj["access_token"]?.jsonPrimitive?.contentOrNull
                    ?: throw IllegalStateException("لم يُرجع الخادم رمز جلسة صالحاً.")
                accessToken = token
                signedInEmail = email.trim()
                email.trim()
            }
        }

    suspend fun pullRemoteCatalog(): Result<Pair<List<TaxonomyNodeEntity>, List<AttributeEntity>>> =
        withContext(Dispatchers.IO) {
            if (!isConfigured) {
                return@withContext Result.failure(
                    IllegalStateException("إعدادات Supabase غير متوفرة في BuildConfig؛ يعمل التطبيق حالياً على قاعدة البيانات المحلية Room.")
                )
            }
            runCatching {
                val nodesJson = getRestArray("taxonomy_nodes?select=id,legacy_id,node_type,name_ar,name_en,description,slug,parent_id,image_path,sort_order,status")
                val attrsJson = getRestArray("attributes?select=id,key,name_ar,name_en,data_type,filter_type,measurement_dimension_id,legacy_unit,status,sort_order")

                val remoteNodes = nodesJson.mapNotNull { elem ->
                    val row = elem as? JsonObject ?: return@mapNotNull null
                    val id = row["id"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    val nameAr = row["name_ar"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    val slug = row["slug"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    TaxonomyNodeEntity(
                        id = id,
                        legacyId = row["legacy_id"]?.jsonPrimitive?.contentOrNull,
                        nodeType = row["node_type"]?.jsonPrimitive?.contentOrNull ?: "category",
                        nameAr = nameAr,
                        nameEn = row["name_en"]?.jsonPrimitive?.contentOrNull,
                        description = row["description"]?.jsonPrimitive?.contentOrNull ?: "",
                        slug = slug,
                        parentId = row["parent_id"]?.jsonPrimitive?.contentOrNull,
                        imagePath = row["image_path"]?.jsonPrimitive?.contentOrNull,
                        sortOrder = row["sort_order"]?.jsonPrimitive?.intOrNull ?: 0,
                        status = row["status"]?.jsonPrimitive?.contentOrNull ?: "active"
                    )
                }

                val remoteAttrs = attrsJson.mapNotNull { elem ->
                    val row = elem as? JsonObject ?: return@mapNotNull null
                    val id = row["id"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    val key = row["key"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    val nameAr = row["name_ar"]?.jsonPrimitive?.contentOrNull ?: return@mapNotNull null
                    AttributeEntity(
                        id = id,
                        key = key,
                        nameAr = nameAr,
                        nameEn = row["name_en"]?.jsonPrimitive?.contentOrNull,
                        dataType = row["data_type"]?.jsonPrimitive?.contentOrNull ?: "string",
                        filterType = row["filter_type"]?.jsonPrimitive?.contentOrNull ?: "select",
                        measurementDimensionId = row["measurement_dimension_id"]?.jsonPrimitive?.contentOrNull,
                        legacyUnit = row["legacy_unit"]?.jsonPrimitive?.contentOrNull,
                        status = row["status"]?.jsonPrimitive?.contentOrNull ?: "active",
                        sortOrder = row["sort_order"]?.jsonPrimitive?.intOrNull ?: 0
                    )
                }

                remoteNodes to remoteAttrs
            }
        }

    private fun getRestArray(queryPath: String): JsonArray {
        val url = URL("$supabaseUrl/rest/v1/$queryPath")
        val bearer = accessToken ?: supabasePublishableKey
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 8000
            readTimeout = 8000
            setRequestProperty("apikey", supabasePublishableKey)
            setRequestProperty("Authorization", "Bearer $bearer")
            setRequestProperty("Accept", "application/json")
        }
        val code = conn.responseCode
        val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
            ?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (code !in 200..299) {
            throw IllegalStateException("خطأ من خادم Supabase ($code)")
        }
        return json.parseToJsonElement(body).jsonArray
    }
}
