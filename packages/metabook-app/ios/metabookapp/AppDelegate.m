#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTDevLoadingView.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>
#import <Firebase.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

#if 0
//#if DEBUG && !TARGET_OS_MACCATALYST
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
//  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@interface ORNSView : UIView
@property NSArray *subviews;
@end

@implementation ORNSView
@dynamic subviews;
@end


@interface ORNSWindowAdditions : NSObject
@property NSUInteger styleMask;
@property BOOL titlebarAppearsTransparent;
@property ORNSView *contentView;
@property id backgroundColor;
@property (getter=isOpaque) BOOL opaque;
@end
@implementation ORNSWindowAdditions
@dynamic styleMask;
@dynamic titlebarAppearsTransparent;
@dynamic contentView;
@end

@interface ORVisualEffectView : UIView
@property NSInteger blendingMode;
@property NSInteger state;
@property NSInteger material;
@end

@implementation ORVisualEffectView
@dynamic blendingMode, state, material;
@end

@interface UIWindow (PSPDFAdditions)

#if TARGET_OS_UIKITFORMAC

/**
    Finds the NSWindow hosting the UIWindow.
    @note This is a hack. Iterates over all windows to find match. Might fail.
 */
@property (nonatomic, readonly, nullable) id nsWindow;

#endif

@end

@implementation UIWindow (PSPDFAdditions)
#define PSPDF_SILENCE_CALL_TO_UNKNOWN_SELECTOR(expression) _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Warc-performSelector-leaks\"") expression _Pragma("clang diagnostic pop")
#if TARGET_OS_UIKITFORMAC

- (nullable ORNSWindowAdditions *)nsWindow {
    id delegate = [[NSClassFromString(@"NSApplication") sharedApplication] delegate];
    const SEL hostWinSEL = NSSelectorFromString([NSString stringWithFormat:@"_%@Window%@Window:", @"host", @"ForUI"]);
    @try {
        // There's also hostWindowForUIWindow 🤷‍♂️
        PSPDF_SILENCE_CALL_TO_UNKNOWN_SELECTOR(id nsWindow = [delegate performSelector:hostWinSEL withObject:self];)
        return nsWindow;
    } @catch (...) {
        NSLog(@"Failed to get NSWindow for %@.", self);
    }
    return nil;
}

#endif

@end


@interface AppDelegate ()

@property (nonatomic, strong) NSDictionary *launchOptions;

@end


@implementation AppDelegate

@synthesize window = _window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

  RCTSetLogThreshold(RCTLogLevelInfo - 1);
#if 0
//#if DEBUG && !TARGET_OS_MACCATALYST
  InitializeFlipper(application);
#endif

  return YES;
}

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions {
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];

  if ([scene isKindOfClass:[UIWindowScene class]]) {
    UIWindowScene *windowScene = (UIWindowScene *)scene;

    self.window = [[UIWindow alloc] initWithWindowScene:windowScene];
    [[UIApplication sharedApplication] delegate].window = self.window;
    #if DEBUG
    [self initializeReactNativeApp];
    #else
    EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
    controller.delegate = self;
    [controller startAndShowLaunchScreen:self.window];
    #endif

#if TARGET_OS_MACCATALYST
    windowScene.titlebar.titleVisibility = UITitlebarTitleVisibilityHidden;
    windowScene.titlebar.toolbar = [[NSToolbar alloc] init];
    windowScene.titlebar.toolbar.showsBaselineSeparator = NO;
    if (windowScene.sizeRestrictions) {
      windowScene.sizeRestrictions.minimumSize = CGSizeMake(370, 600);
    }
#endif
  }
}

- (void)initializeReactNativeApp {
  if (!self.bridge) {
    self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];
    #if RCT_DEV
    [self.bridge moduleForClass:[RCTDevLoadingView class]]; // avoid a weird race that I don't really understand
    #endif
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                     moduleName:@"main"
                                              initialProperties:nil];

    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    self.window.rootViewController = rootViewController;




    #if TARGET_OS_MACCATALYST

    dispatch_async(dispatch_get_main_queue(), ^{
    ORNSWindowAdditions *window = [self.window nsWindow];
    window.styleMask |= 1<<15;

      /*window.opaque = NO;
      window.backgroundColor = [NSClassFromString(@"NSColor") performSelector:@selector(clearColor)];
       rootView.backgroundColor = [UIColor clearColor];

      ORVisualEffectView *visualEffect = (ORVisualEffectView *)[[NSClassFromString(@"NSVisualEffectView") alloc] init];
      [visualEffect setFrame:window.contentView.bounds];
      [visualEffect setAutoresizingMask:65];
      [visualEffect setBlendingMode:(int)0];
      [visualEffect setState:(int)0];
      [visualEffect setMaterial:(int)11];
      NSMutableArray *subviews = [NSMutableArray arrayWithArray:[window.contentView subviews]];
      [[[subviews[0] layer] sublayers][0] setCompositingFilter:nil];
      [subviews insertObject:visualEffect atIndex:0];
      window.contentView.subviews = subviews;*/


      window.titlebarAppearsTransparent = YES;
      [self.window makeKeyAndVisible];
    });
    #else
    [self.window makeKeyAndVisible];
    #endif
  }
}

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
{
  [self initializeReactNativeApp];
  appController.bridge = self.bridge;
}


#if TARGET_OS_MACCATALYST
- (void)buildMenuWithBuilder:(id<UIMenuBuilder>)builder {
  [super buildMenuWithBuilder:builder];

  UIKeyCommand *clearCacheCommand = [UIKeyCommand keyCommandWithInput:@"K" modifierFlags:UIKeyModifierCommand | UIKeyModifierControl action:@selector(clearCaches)];
  clearCacheCommand.title = @"Clear Caches";
  UIMenu *debugMenu = [UIMenu menuWithTitle:@"Debug" children:@[clearCacheCommand]];

  [builder insertSiblingMenu:debugMenu beforeMenuForIdentifier:UIMenuHelp];
}
#endif

- (void)clearCaches {
  NSURL *cacheURL = [[NSFileManager defaultManager] URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask][0];
  [[NSFileManager defaultManager] removeItemAtURL:cacheURL error:nil];

  NSURL *documentsURL = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask][0];
  [[NSFileManager defaultManager] removeItemAtURL:documentsURL error:nil];

#if DEBUG
  exit(0);
#endif
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // You can inject any extra modules that you would like here, more information at:
  // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
#endif
}

@end

