package com.classreminder.models

/**
 * 앱 테마/스킨 설정
 */
enum class AppTheme(
    val displayName: String,
    val primaryColor: String,
    val secondaryColor: String,
    val backgroundColor: String,
    val textColor: String,
    val emoji: String
) {
    DARK_HORROR(
        "다크 호러",
        "#8B0000",
        "#2C0000",
        "#1A0000",
        "#FFFFFF",
        "🦇"
    ),

    NEON_CYBER(
        "네온 사이버",
        "#FF00FF",
        "#00FFFF",
        "#0A0A1F",
        "#FFFFFF",
        "⚡"
    ),

    PASTEL_DREAM(
        "파스텔 드림",
        "#FFB3BA",
        "#BAFFC9",
        "#FFFFBA",
        "#333333",
        "🌸"
    ),

    OCEAN_BLUE(
        "오션 블루",
        "#1E88E5",
        "#0D47A1",
        "#E3F2FD",
        "#000000",
        "🌊"
    ),

    FOREST_GREEN(
        "포레스트 그린",
        "#388E3C",
        "#1B5E20",
        "#E8F5E9",
        "#000000",
        "🌲"
    ),

    SUNSET_ORANGE(
        "선셋 오렌지",
        "#FF6F00",
        "#E65100",
        "#FFF3E0",
        "#000000",
        "🌅"
    ),

    GALAXY_PURPLE(
        "갤럭시 퍼플",
        "#7B1FA2",
        "#4A148C",
        "#F3E5F5",
        "#000000",
        "🌌"
    ),

    RETRO_GAME(
        "레트로 게임",
        "#00FF00",
        "#FFFF00",
        "#000000",
        "#00FF00",
        "🎮"
    ),

    CANDY_POP(
        "캔디 팝",
        "#FF69B4",
        "#FF1493",
        "#FFF0F5",
        "#000000",
        "🍭"
    ),

    MINIMALIST(
        "미니멀리스트",
        "#424242",
        "#757575",
        "#FAFAFA",
        "#212121",
        "⚪"
    );

    companion object {
        fun fromString(value: String): AppTheme {
            return values().find { it.name == value } ?: OCEAN_BLUE
        }
    }

    /**
     * 테마의 주요 색상을 Int로 반환
     */
    fun getPrimaryColorInt(): Int {
        return android.graphics.Color.parseColor(primaryColor)
    }

    fun getSecondaryColorInt(): Int {
        return android.graphics.Color.parseColor(secondaryColor)
    }

    fun getBackgroundColorInt(): Int {
        return android.graphics.Color.parseColor(backgroundColor)
    }

    fun getTextColorInt(): Int {
        return android.graphics.Color.parseColor(textColor)
    }
}
