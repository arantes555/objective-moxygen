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
@property (atomic, strong, readonly) NSString* testProperty2;
/** This is TestClass init function */
- (instancetype) initWithTestProperty:(NSString*)testProperty
                         testProperty2:(NSString*)testProperty2;
/** This is a TestClass method instance */
- (NSString*) testMethod:(NSString*)arg;
/** This is a TestClass static method */
+ (instancetype) staticMethod:(NSString*)arg;
- (NSString*) undocumentedMethod:(NSString*)arg;
@end

#endif /* Simple_h */
