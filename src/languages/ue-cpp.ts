import { common } from "lowlight";
import type { HLJSApi, Language } from "highlight.js";

const UE_KEYWORDS =
  "public protected private virtual override final " +
  "UCLASS UPROPERTY UFUNCTION UPARAM UINTERFACE UENUM USTRUCT " +
  "GENERATED_BODY GENERATED_UCLASS_BODY GENERATED_UINTERFACE_BODY GENERATED_USTRUCT_BODY " +
  "DECLARE_DELEGATE DECLARE_DELEGATE_OneParam DECLARE_DELEGATE_TwoParams " +
  "DECLARE_MULTICAST_DELEGATE DECLARE_MULTICAST_DELEGATE_OneParam " +
  "DECLARE_DYNAMIC_MULTICAST_DELEGATE DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam " +
  "DECLARE_DYNAMIC_DELEGATE DECLARE_DYNAMIC_DELEGATE_RetVal " +
  "TEXT LOCTEXT NSLOCTEXT";

const UE_TYPES =
  "int8 int16 int32 int64 uint8 uint16 uint32 uint64 " +
  "FString FName FText FStringView " +
  "FVector FVector2D FVector4 FIntVector FIntPoint " +
  "FRotator FQuat FTransform FMatrix " +
  "FColor FLinearColor " +
  "FHitResult FActorSpawnParameters FTimerHandle FTimerDelegate " +
  "TArray TMap TSet TMultiMap TQueue TOptional TPair " +
  "TSharedPtr TSharedRef TWeakPtr TUniquePtr " +
  "TObjectPtr TWeakObjectPtr TSoftObjectPtr TSoftClassPtr " +
  "TSubclassOf TEnumAsByte TDelegate TMulticastDelegate " +
  "AActor UObject UActorComponent USceneComponent " +
  "APawn ACharacter AController APlayerController APlayerState " +
  "AGameMode AGameModeBase AGameState AGameStateBase " +
  "UWorld ULevel UGameInstance ULocalPlayer " +
  "UUserWidget UWidgetComponent UTextBlock UImage UButton " +
  "UStaticMeshComponent USkeletalMeshComponent UCameraComponent " +
  "UCharacterMovementComponent UCapsuleComponent";

const UE_KEYWORD_WORDS = UE_KEYWORDS.trim().split(/\s+/);
const UE_TYPE_WORDS = UE_TYPES.trim().split(/\s+/);
const UE_ALL_WORDS = [...UE_KEYWORD_WORDS, ...UE_TYPE_WORDS];

function appendWords(target: unknown, words: string[]): void {
  if (Array.isArray(target)) {
    target.push(...words);
  }
}

function extendWithUE(baseFn: ((hljs: HLJSApi) => Language) | undefined, hljs: HLJSApi): Language {
  if (!baseFn) {
    return { keywords: { keyword: UE_ALL_WORDS, type: UE_TYPE_WORDS }, contains: [] };
  }
  const lang = baseFn(hljs);
  if (lang.keywords && typeof lang.keywords === "object" && !Array.isArray(lang.keywords)) {
    const kw = lang.keywords as Record<string, unknown>;
    appendWords(kw["keyword"], UE_ALL_WORDS);
    appendWords(kw["type"], UE_TYPE_WORDS);
  }
  return lang;
}

const cFn = common["c"] as ((hljs: HLJSApi) => Language) | undefined;
const cppFn = common["cpp"] as ((hljs: HLJSApi) => Language) | undefined;

export const ueC = (hljs: HLJSApi) => extendWithUE(cFn, hljs);
export const ueCpp = (hljs: HLJSApi) => extendWithUE(cppFn, hljs);

export const ueLangs = { ...common, c: ueC, cpp: ueCpp };
