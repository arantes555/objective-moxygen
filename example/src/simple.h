//
//  Simple.h
//  objc-doc-parser
//
//  Created by Mehdi Kouhen on 11/03/2023.
//  Copyright © 2023 Seald SAS. All rights reserved.
//

#ifndef Simple_h
#define Simple_h

#import <Foundation/Foundation.h>

/**
 TestClass is a simple class for tests.
 */
@interface TestClass : NSObject
/** This is a simple test property */
@property (atomic, strong, readonly) NSString* testProperty;
/** This is another simple test property */
@property (nonatomic, weak) OtherClass* testProperty2;
/** This is TestClass init function */
- (instancetype) initWithTestProperty:(NSString*)testPropertyArg
                         testProperty2:(OtherClass*)testPropertyArg2;
/**
 * This is a TestClass method instance
 *
 * @param arg This is arg
 */
- (OtherClass*) testMethod:(NSString*)arg;
/** This is a TestClass method instance */
- (NSString*) testMethodWithNoArgs;
/** This is another TestClass method instance */
- (NSString*) testMethod2WithArg1:(NSString*)arg1 error:(NSError**)err;
/** This is a TestClass static method */
+ (instancetype) staticMethod:(NSString*)arg;
- (NSString*) undocumentedMethod:(NSString*)arg;
@end

@interface OtherClass : NSObject
@end
#endif /* Simple_h */
